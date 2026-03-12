import { CollectionService, Players, Workspace } from "@rbxts/services";
import { NPCConfigs } from "shared/data/npcs";
import { DialogueConfigs } from "shared/data/dialogues";
import { fireClient } from "server/network/server-network";

const NPC_TAG = "NPC";
const INTERACT_RANGE = 12;

// --- Types ---

interface NPCState {
	npcId: string;
	configId: string;
	instance: Model | BasePart;
	position: Vector3;
}

interface PlayerDialogueState {
	npcId: string;
	configId: string;
	currentNodeId: string;
}

// --- State ---

let npcIdCounter = 0;
const npcs = new Map<string, NPCState>();
const playerDialogues = new Map<Player, PlayerDialogueState>();

// --- Public API ---

/** Handle a player interacting with an NPC. */
export function interactNPC(player: Player, npcId: string): void {
	// Close any existing dialogue
	if (playerDialogues.has(player)) {
		closeDialogue(player);
	}

	const npc = npcs.get(npcId);
	if (!npc) return;

	const config = NPCConfigs[npc.configId];
	if (!config) return;

	// Range check
	const rootPart = player.Character?.FindFirstChild("HumanoidRootPart") as Part | undefined;
	if (!rootPart) return;
	const distance = rootPart.Position.sub(npc.position).Magnitude;
	if (distance > INTERACT_RANGE) return;

	// Open dialogue if available
	if (config.dialogueId) {
		openDialogue(player, npcId, npc.configId, config.dialogueId);
	}
}

/** Handle a player selecting a dialogue option. */
export function selectDialogueOption(player: Player, optionIndex: number): void {
	const state = playerDialogues.get(player);
	if (!state) return;

	const config = NPCConfigs[state.configId];
	if (!config || !config.dialogueId) return;

	const dialogue = DialogueConfigs[config.dialogueId];
	if (!dialogue) return;

	const node = dialogue.nodes[state.currentNodeId];
	if (!node) return;

	if (optionIndex < 0 || optionIndex >= node.options.size()) return;

	const option = node.options[optionIndex];

	// Process action if present
	if (option.action) {
		switch (option.action.type) {
			case "openShop":
				closeDialogue(player);
				if (option.action.shopId && shopOpenCallback) {
					shopOpenCallback(player, option.action.shopId);
				}
				return;
			case "giveItem":
				if (option.action.itemId && giveItemCallback) {
					giveItemCallback(player, option.action.itemId, option.action.quantity ?? 1);
				}
				break;
			case "closeDialogue":
				closeDialogue(player);
				return;
		}
	}

	// Navigate to next node
	if (option.nextNodeId) {
		const nextNode = dialogue.nodes[option.nextNodeId];
		if (nextNode) {
			state.currentNodeId = option.nextNodeId;
			const npc = npcs.get(state.npcId);
			const npcName = config.name;
			const options = nextNode.options.map((opt) => ({ label: opt.label }));
			fireClient(player, "DialogueOpened", {
				npcId: state.npcId,
				npcName,
				nodeId: option.nextNodeId,
				text: nextNode.text,
				options,
			});
			return;
		}
	}

	// No next node and no close action — close by default
	closeDialogue(player);
}

/** Close the player's current dialogue. */
export function closeDialogue(player: Player): void {
	if (playerDialogues.has(player)) {
		playerDialogues.delete(player);
		fireClient(player, "DialogueClosed", undefined);
	}
}

/** Check if a player is currently in dialogue. */
export function isInDialogue(player: Player): boolean {
	return playerDialogues.has(player);
}

// --- Callbacks ---

let shopOpenCallback: ((player: Player, shopId: string) => void) | undefined;
let giveItemCallback: ((player: Player, itemId: string, quantity: number) => void) | undefined;

export function setShopOpenCallback(callback: (player: Player, shopId: string) => void): void {
	shopOpenCallback = callback;
}

export function setGiveItemCallback(
	callback: (player: Player, itemId: string, quantity: number) => void,
): void {
	giveItemCallback = callback;
}

// --- Internal ---

function openDialogue(
	player: Player,
	npcId: string,
	configId: string,
	dialogueId: string,
): void {
	const dialogue = DialogueConfigs[dialogueId];
	if (!dialogue) return;

	const startNode = dialogue.nodes[dialogue.startNodeId];
	if (!startNode) return;

	const config = NPCConfigs[configId];
	if (!config) return;

	playerDialogues.set(player, {
		npcId,
		configId,
		currentNodeId: dialogue.startNodeId,
	});

	const options = startNode.options.map((opt) => ({ label: opt.label }));
	fireClient(player, "DialogueOpened", {
		npcId,
		npcName: config.name,
		nodeId: dialogue.startNodeId,
		text: startNode.text,
		options,
	});
}

function registerNPC(instance: Model | BasePart, configId: string): void {
	const config = NPCConfigs[configId];
	if (!config) {
		warn(`[NPCService] Unknown NPC config: ${configId}`);
		return;
	}

	npcIdCounter++;
	const npcId = `npc_${npcIdCounter}`;

	instance.SetAttribute("NPCId", npcId);
	instance.SetAttribute("NPCConfigId", configId);

	const position = instance.IsA("Model")
		? (instance.PrimaryPart?.Position ?? new Vector3(0, 0, 0))
		: instance.Position;

	npcs.set(npcId, {
		npcId,
		configId,
		instance,
		position,
	});

	// Create ProximityPrompt if one doesn't already exist, then wire it
	let prompt = instance.FindFirstChildWhichIsA("ProximityPrompt");
	if (!prompt) {
		prompt = new Instance("ProximityPrompt");
		prompt.ActionText = "Talk";
		prompt.ObjectText = config.name;
		prompt.MaxActivationDistance = INTERACT_RANGE;
		prompt.HoldDuration = 0;
		prompt.Parent = instance;
	}
	prompt.Triggered.Connect((player) => {
		interactNPC(player, npcId);
	});
}

/** Create test NPCs if none are found. */
function createTestNPCs(): void {
	const testNPCs = [
		{ configId: "general_store_owner", x: 20, z: 0 },
		{ configId: "weapon_smith", x: 0, z: -20 },
		{ configId: "mining_instructor", x: -20, z: 20 },
		{ configId: "town_guide", x: 10, z: 10 },
	];

	for (const entry of testNPCs) {
		const config = NPCConfigs[entry.configId];
		if (!config) continue;

		const part = new Instance("Part");
		part.Name = config.name;
		part.Anchored = true;
		part.CanCollide = true;
		part.Size = new Vector3(2, 5, 2);
		part.Position = new Vector3(entry.x, 2.5, entry.z);
		part.Color = Color3.fromRGB(100, 180, 255);
		part.Material = Enum.Material.SmoothPlastic;

		// Name billboard
		const billboard = new Instance("BillboardGui");
		billboard.Adornee = part;
		billboard.Size = new UDim2(0, 140, 0, 25);
		billboard.StudsOffset = new Vector3(0, 4, 0);
		billboard.AlwaysOnTop = true;
		billboard.Parent = part;

		const nameLabel = new Instance("TextLabel");
		nameLabel.Size = UDim2.fromScale(1, 1);
		nameLabel.BackgroundTransparency = 1;
		nameLabel.Text = config.name;
		nameLabel.TextColor3 = Color3.fromRGB(255, 255, 100);
		nameLabel.TextScaled = true;
		nameLabel.Font = Enum.Font.GothamBold;
		nameLabel.TextStrokeTransparency = 0.5;
		nameLabel.TextStrokeColor3 = Color3.fromRGB(0, 0, 0);
		nameLabel.Parent = billboard;

		CollectionService.AddTag(part, NPC_TAG);
		part.SetAttribute("NPCConfigId", entry.configId);
		part.Parent = Workspace;
	}
}

// --- Initialize ---

export function initialize(): void {
	// Scan for tagged NPCs
	const taggedNPCs = CollectionService.GetTagged(NPC_TAG);
	for (const instance of taggedNPCs) {
		const configId = instance.GetAttribute("NPCConfigId") as string | undefined;
		if (configId && (instance.IsA("BasePart") || instance.IsA("Model"))) {
			registerNPC(instance, configId);
		}
	}

	// Listen for NPCs added at runtime
	CollectionService.GetInstanceAddedSignal(NPC_TAG).Connect((instance) => {
		const configId = instance.GetAttribute("NPCConfigId") as string | undefined;
		if (configId && (instance.IsA("BasePart") || instance.IsA("Model"))) {
			registerNPC(instance, configId);
		}
	});

	// If no NPCs found, create test ones
	if (npcs.size() === 0) {
		print("[NPCService] No NPCs found — creating test NPCs");
		createTestNPCs();
	}

	// Clean up dialogue state on leave
	Players.PlayerRemoving.Connect((player) => {
		playerDialogues.delete(player);
	});

	print("[NPCService] Initialized");
}
