import { CollectionService, Players, Workspace } from "@rbxts/services";
import { GatheringNodeConfigs } from "shared/data/gathering-nodes";
import { fireClient, fireAllClients } from "server/network/server-network";
import * as SkillService from "./skill-service";
import * as InventoryService from "./inventory-service";
import * as GameLoopService from "./game-loop-service";
import * as LootService from "./loot-service";

const NODE_TAG = "GatherNode";
const GATHER_RANGE = 10;
const BASE_SWING_COOLDOWN = 2.0; // seconds, modified by tool speedMultiplier

// Progressive damage color (dark cracked brown-grey) and depleted appearance
const DAMAGED_COLOR = Color3.fromRGB(70, 60, 50);
const DEPLETED_COLOR = Color3.fromRGB(45, 42, 38);
const DEPLETED_TRANSPARENCY = 0.35;

// --- Types ---

interface NodeState {
	nodeId: string;
	configId: string;
	instance: BasePart;
	position: Vector3;
	depleted: boolean;
	respawnAt: number;
	currentHits: number;
}

interface NodeVisuals {
	parts: BasePart[];
	colors: Color3[];
	transparencies: number[];
}

// --- State ---

let nodeIdCounter = 0;
const nodes = new Map<string, NodeState>();
const playerLastHitTime = new Map<Player, number>();
const nodeVisuals = new Map<string, NodeVisuals>();

// --- Visual Helpers ---

/** Returns all BaseParts belonging to a node (handles plain parts and Models). */
function getNodeParts(node: NodeState): BasePart[] {
	const parent = node.instance.Parent;
	if (parent && parent.IsA("Model") && parent !== Workspace) {
		const parts: BasePart[] = [];
		for (const desc of parent.GetDescendants()) {
			if (desc.IsA("BasePart")) parts.push(desc);
		}
		return parts;
	}
	return [node.instance];
}

/** Caches original colors/transparencies on first call; returns cached on subsequent calls. */
function cacheNodeVisuals(node: NodeState): NodeVisuals {
	const existing = nodeVisuals.get(node.nodeId);
	if (existing) return existing;

	const parts = getNodeParts(node);
	const colors: Color3[] = [];
	const transparencies: number[] = [];
	for (const part of parts) {
		colors.push(part.Color);
		transparencies.push(part.Transparency);
	}

	const visuals: NodeVisuals = { parts, colors, transparencies };
	nodeVisuals.set(node.nodeId, visuals);
	return visuals;
}

/** Lerps all node parts toward the damaged color based on hit progress (0–1). */
function applyProgressVisual(node: NodeState, progress: number): void {
	const v = cacheNodeVisuals(node);
	for (let i = 0; i < v.parts.size(); i++) {
		v.parts[i].Color = v.colors[i].Lerp(DAMAGED_COLOR, progress * 0.75);
	}
}

/** Applies the fully-depleted appearance to all node parts. */
function applyDepletedVisual(node: NodeState): void {
	const v = cacheNodeVisuals(node);
	for (const part of v.parts) {
		part.Color = DEPLETED_COLOR;
		part.Transparency = DEPLETED_TRANSPARENCY;
	}
}

/** Restores all node parts to their original appearance. */
function restoreNodeVisual(node: NodeState): void {
	const v = nodeVisuals.get(node.nodeId);
	if (!v) return;
	for (let i = 0; i < v.parts.size(); i++) {
		v.parts[i].Color = v.colors[i];
		v.parts[i].Transparency = v.transparencies[i];
	}
}

// --- Public API ---

/**
 * Called when the player swings a tool at a gathering node.
 * Each call is one hit; depletes when hits reach hitsRequired.
 */
export function hitNode(player: Player, nodeId: string): void {
	const node = nodes.get(nodeId);
	if (!node) return;

	if (node.depleted) {
		fireClient(player, "GatherFailed", { reason: "This node is depleted." });
		return;
	}

	const config = GatheringNodeConfigs[node.configId];
	if (!config) return;

	// Range check
	const rootPart = player.Character?.FindFirstChild("HumanoidRootPart") as Part | undefined;
	if (!rootPart) return;

	const distance = rootPart.Position.sub(node.position).Magnitude;
	if (distance > GATHER_RANGE) {
		fireClient(player, "GatherFailed", { reason: "Too far away." });
		return;
	}

	// Skill level check
	const skillProgress = SkillService.getSkillProgress(player, config.skillId);
	if (skillProgress.level < config.levelRequired) {
		fireClient(player, "GatherFailed", {
			reason: `Requires ${config.skillId} level ${config.levelRequired}.`,
		});
		return;
	}

	// Tool check + derive swing cooldown from tool speed
	let swingCooldown = BASE_SWING_COOLDOWN;
	if (config.toolRequired) {
		const tool = SkillService.findBestTool(player, config.skillId);
		if (!tool) {
			fireClient(player, "GatherFailed", {
				reason: `You need a tool for ${config.skillId}.`,
			});
			return;
		}
		swingCooldown = BASE_SWING_COOLDOWN * tool.speedMultiplier;
	}

	// Per-player swing cooldown
	const now = os.clock();
	const lastHit = playerLastHitTime.get(player) ?? 0;
	if (now - lastHit < swingCooldown) return;
	playerLastHitTime.set(player, now);

	// Apply hit
	node.currentHits++;

	const progress = node.currentHits / config.hitsRequired;
	applyProgressVisual(node, progress);
	fireAllClients("NodeHit", { nodeId: node.nodeId, currentHits: node.currentHits, hitsRequired: config.hitsRequired });

	if (node.currentHits >= config.hitsRequired) {
		completeNode(player, node);
	}
}

// --- Internal ---

function completeNode(player: Player, node: NodeState): void {
	const config = GatheringNodeConfigs[node.configId];
	if (!config) return;

	const drops = LootService.rollLoot(config.lootTableId);
	for (const drop of drops) {
		InventoryService.addItem(player, drop.itemId, drop.quantity);
		fireClient(player, "GatherComplete", {
			nodeId: node.nodeId,
			itemId: drop.itemId,
			quantity: drop.quantity,
		});
	}

	SkillService.grantSkillExp(player, config.skillId, config.expReward);

	depleteNode(node.nodeId);
}

function registerNode(instance: BasePart, configId: string, parentModel?: Model): void {
	const config = GatheringNodeConfigs[configId];
	if (!config) {
		warn(`[GatheringService] Unknown node config: ${configId}`);
		return;
	}

	nodeIdCounter++;
	const nodeId = `node_${nodeIdCounter}`;

	instance.SetAttribute("NodeId", nodeId);
	instance.SetAttribute("NodeConfigId", configId);

	if (parentModel) {
		parentModel.SetAttribute("NodeId", nodeId);
	}

	nodes.set(nodeId, {
		nodeId,
		configId,
		instance,
		position: instance.Position,
		depleted: false,
		respawnAt: 0,
		currentHits: 0,
	});
}

function depleteNode(nodeId: string): void {
	const node = nodes.get(nodeId);
	if (!node) return;

	const config = GatheringNodeConfigs[node.configId];
	if (!config) return;

	node.depleted = true;
	node.respawnAt = os.clock() + config.respawnTime;
	applyDepletedVisual(node);

	fireAllClients("NodeDepleted", { nodeId });
}

function respawnNode(nodeId: string): void {
	const node = nodes.get(nodeId);
	if (!node) return;

	node.depleted = false;
	node.respawnAt = 0;
	node.currentHits = 0;
	restoreNodeVisual(node);

	fireAllClients("NodeRespawned", { nodeId });
}

/** Game loop: check node respawns only. */
function update(_dt: number): void {
	const now = os.clock();
	nodes.forEach((node, nodeId) => {
		if (node.depleted && node.respawnAt > 0 && now >= node.respawnAt) {
			respawnNode(nodeId);
		}
	});
}

function createTestNodes(): void {
	const testNodes = [
		{ configId: "copper_rock", x: -30, z: 40 },
		{ configId: "copper_rock", x: -25, z: 45 },
		{ configId: "tin_rock", x: -20, z: 40 },
		{ configId: "normal_tree", x: -40, z: 30 },
		{ configId: "normal_tree", x: -45, z: 35 },
		{ configId: "fishing_spot", x: -50, z: 50 },
	];

	for (const entry of testNodes) {
		const config = GatheringNodeConfigs[entry.configId];
		if (!config) continue;

		const part = new Instance("Part");
		part.Name = config.name;
		part.Anchored = true;
		part.CanCollide = true;
		part.Position = new Vector3(entry.x, 5, entry.z);

		if (config.skillId === "mining") {
			part.Size = new Vector3(3, 3, 3);
			part.Color = Color3.fromRGB(139, 90, 43);
			part.Material = Enum.Material.Slate;
		} else if (config.skillId === "woodcutting") {
			part.Size = new Vector3(2, 6, 2);
			part.Color = Color3.fromRGB(86, 130, 60);
			part.Material = Enum.Material.Wood;
		} else if (config.skillId === "fishing") {
			part.Size = new Vector3(4, 0.5, 4);
			part.Color = Color3.fromRGB(50, 100, 200);
			part.Material = Enum.Material.Water;
		}

		const billboard = new Instance("BillboardGui");
		billboard.Adornee = part;
		billboard.Size = new UDim2(0, 120, 0, 25);
		billboard.StudsOffset = new Vector3(0, 3, 0);
		billboard.AlwaysOnTop = true;
		billboard.Parent = part;

		const nameLabel = new Instance("TextLabel");
		nameLabel.Size = UDim2.fromScale(1, 1);
		nameLabel.BackgroundTransparency = 1;
		nameLabel.Text = config.name;
		nameLabel.TextColor3 = Color3.fromRGB(255, 255, 200);
		nameLabel.TextScaled = true;
		nameLabel.Font = Enum.Font.GothamBold;
		nameLabel.TextStrokeTransparency = 0.5;
		nameLabel.TextStrokeColor3 = Color3.fromRGB(0, 0, 0);
		nameLabel.Parent = billboard;

		CollectionService.AddTag(part, NODE_TAG);
		part.SetAttribute("NodeConfigId", entry.configId);
		part.Parent = Workspace;
	}
}

// --- Initialize ---

export function initialize(): void {
	const taggedNodes = CollectionService.GetTagged(NODE_TAG);
	for (const instance of taggedNodes) {
		const configId = instance.GetAttribute("NodeConfigId") as string | undefined;
		if (!configId) continue;
		if (instance.IsA("BasePart")) {
			registerNode(instance, configId);
		} else if (instance.IsA("Model")) {
			const primary = instance.PrimaryPart;
			if (primary) {
				registerNode(primary, configId, instance);
			} else {
				warn(`[GatheringService] Model "${instance.Name}" has no PrimaryPart`);
			}
		}
	}

	CollectionService.GetInstanceAddedSignal(NODE_TAG).Connect((instance) => {
		const configId = instance.GetAttribute("NodeConfigId") as string | undefined;
		if (!configId) return;
		if (instance.IsA("BasePart")) {
			registerNode(instance, configId);
		} else if (instance.IsA("Model")) {
			const primary = instance.PrimaryPart;
			if (primary) {
				registerNode(primary, configId, instance);
			}
		}
	});

	if (nodes.size() === 0) {
		print("[GatheringService] No gather nodes found — creating test nodes");
		createTestNodes();
	}

	Players.PlayerRemoving.Connect((player) => {
		playerLastHitTime.delete(player);
	});

	GameLoopService.registerSystem("Gathering", 4, update);

	print("[GatheringService] Initialized");
}
