import { Players, Workspace } from "@rbxts/services";
import { ItemConfigs, RARITY_COLORS } from "shared/data/items";
import { fireClient, fireAllClients } from "server/network/server-network";
import * as GameLoopService from "./game-loop-service";

const DESPAWN_TIME = 60; // seconds before ground item disappears
const OWNERSHIP_TIME = 30; // seconds of kill-priority before public
const PICKUP_RANGE = 10; // studs

// --- Types ---

interface GroundItemState {
	groundItemId: string;
	itemId: string;
	quantity: number;
	instance: Model;
	position: Vector3;
	spawnTime: number;
	/** Player who has pickup priority (the killer). undefined = public. */
	owner: Player | undefined;
	ownershipExpiry: number;
}

// --- State ---

let itemIdCounter = 0;
const groundItems = new Map<string, GroundItemState>();

// --- Public API ---

/** Spawn a ground item in the world. Returns the groundItemId. */
export function spawnGroundItem(
	itemId: string,
	quantity: number,
	position: Vector3,
	owner?: Player,
): string {
	const config = ItemConfigs[itemId];
	if (!config) {
		warn(`[GroundItemService] Unknown item: ${itemId}`);
		return "";
	}

	itemIdCounter++;
	const groundItemId = `ground_${itemIdCounter}`;
	const now = os.clock();

	const instance = createGroundItemModel(itemId, groundItemId, position);

	const state: GroundItemState = {
		groundItemId,
		itemId,
		quantity,
		instance,
		position,
		spawnTime: now,
		owner,
		ownershipExpiry: owner ? now + OWNERSHIP_TIME : 0,
	};

	groundItems.set(groundItemId, state);

	// Notify all clients
	fireAllClients("GroundItemSpawned", {
		groundItemId,
		itemId,
		quantity,
		position: { x: position.X, y: position.Y, z: position.Z },
	});

	return groundItemId;
}

/** Try to pick up a ground item. Returns item info if successful. */
export function pickupGroundItem(
	player: Player,
	groundItemId: string,
): { itemId: string; quantity: number } | undefined {
	const state = groundItems.get(groundItemId);
	if (!state) return undefined;

	// Range check
	const rootPart = player.Character?.FindFirstChild("HumanoidRootPart") as Part | undefined;
	if (!rootPart) return undefined;

	const distance = rootPart.Position.sub(state.position).Magnitude;
	if (distance > PICKUP_RANGE) return undefined;

	// Ownership check
	const now = os.clock();
	if (state.owner && state.owner !== player && now < state.ownershipExpiry) {
		return undefined;
	}

	// Remove ground item
	removeGroundItem(groundItemId);

	return { itemId: state.itemId, quantity: state.quantity };
}

/** Get pickup range for validation. */
export function getPickupRange(): number {
	return PICKUP_RANGE;
}

// --- Internal ---

function createGroundItemModel(itemId: string, groundItemId: string, position: Vector3): Model {
	const config = ItemConfigs[itemId];
	const model = new Instance("Model");
	model.Name = `GroundItem_${groundItemId}`;

	const part = new Instance("Part");
	part.Name = "ItemPart";
	part.Size = new Vector3(1, 1, 1);
	part.Anchored = true;
	part.CanCollide = false;
	part.Shape = Enum.PartType.Ball;
	part.Color = config ? RARITY_COLORS[config.rarity] : Color3.fromRGB(200, 200, 200);
	part.Material = Enum.Material.Neon;
	part.CFrame = new CFrame(position.X, position.Y + 0.5, position.Z);
	part.Parent = model;

	// Name billboard
	const billboard = new Instance("BillboardGui");
	billboard.Adornee = part;
	billboard.Size = new UDim2(0, 120, 0, 30);
	billboard.StudsOffset = new Vector3(0, 1.5, 0);
	billboard.AlwaysOnTop = true;
	billboard.Parent = part;

	const label = new Instance("TextLabel");
	label.Size = UDim2.fromScale(1, 1);
	label.BackgroundTransparency = 1;
	label.Text = config ? config.name : itemId;
	label.TextColor3 = config ? RARITY_COLORS[config.rarity] : Color3.fromRGB(255, 255, 255);
	label.TextScaled = true;
	label.Font = Enum.Font.GothamBold;
	label.TextStrokeTransparency = 0.5;
	label.TextStrokeColor3 = Color3.fromRGB(0, 0, 0);
	label.Parent = billboard;

	model.SetAttribute("GroundItemId", groundItemId);
	model.PrimaryPart = part;
	model.Parent = Workspace;

	return model;
}

function removeGroundItem(groundItemId: string): void {
	const state = groundItems.get(groundItemId);
	if (!state) return;

	state.instance.Destroy();
	groundItems.delete(groundItemId);

	fireAllClients("GroundItemRemoved", { groundItemId });
}

/** Cleanup loop: despawn expired items and clear stale owners. */
function update(_dt: number): void {
	const now = os.clock();

	groundItems.forEach((state, groundItemId) => {
		// Despawn timer
		if (now - state.spawnTime >= DESPAWN_TIME) {
			removeGroundItem(groundItemId);
			return;
		}

		// Clear ownership after expiry
		if (state.owner && now >= state.ownershipExpiry) {
			state.owner = undefined;
		}

		// Clear owner if they left the game
		if (state.owner && !state.owner.IsDescendantOf(Players)) {
			state.owner = undefined;
		}
	});
}

// --- Initialize ---

export function initialize(): void {
	GameLoopService.registerSystem("GroundItems", 30, update);

	// Clean up owner references when players leave
	Players.PlayerRemoving.Connect((player) => {
		groundItems.forEach((state) => {
			if (state.owner === player) {
				state.owner = undefined;
			}
		});
	});

	print("[GroundItemService] Initialized");
}
