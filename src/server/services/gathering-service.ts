import { CollectionService, Players, Workspace } from "@rbxts/services";
import { GatheringNodeConfigs } from "shared/data/gathering-nodes";
import { fireClient, fireAllClients } from "server/network/server-network";
import * as SkillService from "./skill-service";
import * as InventoryService from "./inventory-service";
import * as GameLoopService from "./game-loop-service";
import * as LootService from "./loot-service";

const NODE_TAG = "GatherNode";
const GATHER_RANGE = 10;

// --- Types ---

interface NodeState {
	nodeId: string;
	configId: string;
	instance: BasePart;
	position: Vector3;
	depleted: boolean;
	respawnAt: number;
	/** Original transparency to restore on respawn */
	originalTransparency: number;
}

interface PlayerGatherState {
	nodeId: string;
	startTime: number;
	gatherTime: number;
}

// --- State ---

let nodeIdCounter = 0;
const nodes = new Map<string, NodeState>();
const playerGathering = new Map<Player, PlayerGatherState>();

// --- Public API ---

/** Start gathering a node. Validates all requirements. */
export function startGather(player: Player, nodeId: string): void {
	// Already gathering?
	if (playerGathering.has(player)) {
		fireClient(player, "GatherFailed", { reason: "Already gathering." });
		return;
	}

	const node = nodes.get(nodeId);
	if (!node) {
		fireClient(player, "GatherFailed", { reason: "Node not found." });
		return;
	}

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
			reason: `Requires ${config.skillId} level ${config.levelRequired}. You are level ${skillProgress.level}.`,
		});
		return;
	}

	// Tool check
	let gatherTime = config.gatherTime;
	if (config.toolRequired) {
		const tool = SkillService.findBestTool(player, config.skillId);
		if (!tool) {
			fireClient(player, "GatherFailed", {
				reason: `You need a tool for ${config.skillId}.`,
			});
			return;
		}
		gatherTime = config.gatherTime * tool.speedMultiplier;
	}

	// Start gathering
	playerGathering.set(player, {
		nodeId,
		startTime: os.clock(),
		gatherTime,
	});

	fireClient(player, "GatherStarted", { nodeId, gatherTime });
}

/** Cancel an in-progress gather. */
export function cancelGather(player: Player): void {
	playerGathering.delete(player);
}

// --- Internal ---

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

	// Also stamp the NodeId on the parent Model so client click-detection finds it
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
		originalTransparency: instance.Transparency,
	});
}

function depleteNode(nodeId: string): void {
	const node = nodes.get(nodeId);
	if (!node) return;

	const config = GatheringNodeConfigs[node.configId];
	if (!config) return;

	node.depleted = true;
	node.respawnAt = os.clock() + config.respawnTime;

	// Visual feedback: make it semi-transparent
	node.instance.Transparency = 0.7;

	fireAllClients("NodeDepleted", { nodeId });
}

function respawnNode(nodeId: string): void {
	const node = nodes.get(nodeId);
	if (!node) return;

	node.depleted = false;
	node.respawnAt = 0;
	node.instance.Transparency = node.originalTransparency;

	fireAllClients("NodeRespawned", { nodeId });
}

function completeGather(player: Player, gatherState: PlayerGatherState): void {
	playerGathering.delete(player);

	const node = nodes.get(gatherState.nodeId);
	if (!node || node.depleted) return;

	const config = GatheringNodeConfigs[node.configId];
	if (!config) return;

	// Re-validate range
	const rootPart = player.Character?.FindFirstChild("HumanoidRootPart") as Part | undefined;
	if (!rootPart) return;
	const distance = rootPart.Position.sub(node.position).Magnitude;
	if (distance > GATHER_RANGE * 1.5) return;

	// Roll loot
	const drops = LootService.rollLoot(config.lootTableId);
	if (drops.size() === 0) return;

	// Give items and EXP
	for (const drop of drops) {
		InventoryService.addItem(player, drop.itemId, drop.quantity);
		fireClient(player, "GatherComplete", {
			nodeId: gatherState.nodeId,
			itemId: drop.itemId,
			quantity: drop.quantity,
		});
	}

	SkillService.grantSkillExp(player, config.skillId, config.expReward);

	// Deplete node
	depleteNode(gatherState.nodeId);
}

/** Game loop: check gather completion and node respawns. */
function update(_dt: number): void {
	const now = os.clock();

	// Check gather completions
	playerGathering.forEach((gatherState, player) => {
		if (!player.IsDescendantOf(Players)) {
			playerGathering.delete(player);
			return;
		}

		if (now - gatherState.startTime >= gatherState.gatherTime) {
			completeGather(player, gatherState);
		}
	});

	// Check node respawns
	nodes.forEach((node, nodeId) => {
		if (node.depleted && node.respawnAt > 0 && now >= node.respawnAt) {
			respawnNode(nodeId);
		}
	});
}

/** Create test gathering nodes if none are found. */
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

		// Visual style per skill
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

		// Name billboard
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
	// Scan for tagged nodes
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
				warn(`[GatheringService] Model "${instance.Name}" has no PrimaryPart — set one in Studio`);
			}
		}
	}

	// Listen for nodes added at runtime
	CollectionService.GetInstanceAddedSignal(NODE_TAG).Connect((instance) => {
		const configId = instance.GetAttribute("NodeConfigId") as string | undefined;
		if (!configId) return;
		if (instance.IsA("BasePart")) {
			registerNode(instance, configId);
		} else if (instance.IsA("Model")) {
			const primary = instance.PrimaryPart;
			if (primary) {
				registerNode(primary, configId, instance);
			} else {
				warn(`[GatheringService] Model "${instance.Name}" has no PrimaryPart — set one in Studio`);
			}
		}
	});

	// If no nodes found, create test ones
	if (nodes.size() === 0) {
		print("[GatheringService] No gather nodes found — creating test nodes");
		createTestNodes();
	}

	// Clean up player gather state on leave
	Players.PlayerRemoving.Connect((player) => {
		playerGathering.delete(player);
	});

	GameLoopService.registerSystem("Gathering", 25, update);

	print("[GatheringService] Initialized");
}
