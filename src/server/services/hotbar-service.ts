import { Players } from "@rbxts/services";
import { InventoryItem, InventoryTab, HOTBAR_SIZE } from "shared/types/player";
import { ItemConfigs } from "shared/data/items";
import { fireClient } from "server/network/server-network";
import * as PlayerDataService from "./player-data-service";
import * as InventoryService from "./inventory-service";

// --- Callbacks ---

type HotbarChangedCallback = (player: Player) => void;
let onHotbarChanged: HotbarChangedCallback = () => {};

export function setHotbarChangedCallback(cb: HotbarChangedCallback): void {
	onHotbarChanged = cb;
}

// --- State ---

const activeItems = new Map<Player, string | undefined>();

export function getActiveItemId(player: Player): string | undefined {
	return activeItems.get(player);
}

function setActiveItemId(player: Player, itemId: string | undefined): void {
	activeItems.set(player, itemId);
	onHotbarChanged(player);
}

// --- Public API ---

/** Move an item from an inventory slot into a hotbar slot. */
export function assignHotbarSlot(
	player: Player,
	hotbarSlot: number,
	tab: InventoryTab,
	itemSlot: number,
): boolean {
	if (hotbarSlot < 0 || hotbarSlot >= HOTBAR_SIZE) return false;

	const profile = PlayerDataService.getProfile(player);
	if (!profile) return false;

	const tabData = profile.inventory[tab];
	if (itemSlot < 0 || itemSlot >= tabData.slotCount) return false;

	const item = tabData.slots[itemSlot];
	if (!item) return false;

	// Remove item from inventory
	tabData.slots[itemSlot] = undefined;

	// Return any existing hotbar item to inventory
	const existing = profile.hotbar[hotbarSlot];
	if (existing !== undefined) {
		InventoryService.addItem(player, existing.itemId, existing.quantity);
	}

	profile.hotbar[hotbarSlot] = { itemId: item.itemId, quantity: item.quantity };

	syncHotbar(player);
	InventoryService.syncAllTabs(player);
	rebuildTools(player);

	return true;
}

/** Remove an item from a hotbar slot, returning it to inventory. */
export function clearHotbarSlot(player: Player, hotbarSlot: number): boolean {
	if (hotbarSlot < 0 || hotbarSlot >= HOTBAR_SIZE) return false;

	const profile = PlayerDataService.getProfile(player);
	if (!profile) return false;

	const item = profile.hotbar[hotbarSlot];
	if (!item) return false;

	InventoryService.addItem(player, item.itemId, item.quantity);
	profile.hotbar[hotbarSlot] = undefined;

	syncHotbar(player);
	InventoryService.syncAllTabs(player);
	rebuildTools(player);

	return true;
}

/** Rebuild Tools in Backpack to match profile.hotbar. */
function rebuildTools(player: Player): void {
	const profile = PlayerDataService.getProfile(player);
	if (!profile) return;

	const backpack = player.FindFirstChildOfClass("Backpack");
	if (!backpack) return;

	// Remove all existing hotbar-managed tools from backpack
	for (const child of backpack.GetChildren()) {
		if (child.IsA("Tool") && child.GetAttribute("HotbarSlot") !== undefined) {
			child.Destroy();
		}
	}

	// Remove any hotbar tool currently equipped in the character
	const character = player.Character;
	if (character) {
		for (const child of character.GetChildren()) {
			if (child.IsA("Tool") && child.GetAttribute("HotbarSlot") !== undefined) {
				child.Destroy();
			}
		}
	}

	// Recreate tools for occupied slots
	for (let i = 0; i < HOTBAR_SIZE; i++) {
		const item = profile.hotbar[i];
		if (item !== undefined) {
			createTool(player, item.itemId, i);
		}
	}
}

function createTool(player: Player, itemId: string, hotbarSlot: number): void {
	const backpack = player.FindFirstChildOfClass("Backpack");
	if (!backpack) return;

	const config = ItemConfigs[itemId];
	if (!config) return;

	const tool = new Instance("Tool");
	tool.Name = config.name;
	tool.RequiresHandle = true;
	tool.ToolTip = config.description;
	tool.CanBeDropped = false;
	tool.SetAttribute("HotbarSlot", hotbarSlot);
	tool.SetAttribute("ItemId", itemId);

	// Invisible handle required for Tool to be equippable
	const handle = new Instance("Part");
	handle.Name = "Handle";
	handle.Size = new Vector3(0.5, 0.5, 2.5);
	handle.Transparency = 1;
	handle.CanCollide = false;
	handle.Parent = tool;

	tool.Equipped.Connect(() => {
		setActiveItemId(player, itemId);
	});

	tool.Unequipped.Connect(() => {
		setActiveItemId(player, undefined);
	});

	tool.Parent = backpack;
}

function syncHotbar(player: Player): void {
	const profile = PlayerDataService.getProfile(player);
	if (!profile) return;
	fireClient(player, "HotbarUpdated", { hotbar: profile.hotbar });
}

/** Restore hotbar Tools from profile. Call after profile load and after respawn. */
export function restoreHotbar(player: Player): void {
	rebuildTools(player);
	syncHotbar(player);
}

// --- Initialize ---

export function initialize(): void {
	Players.PlayerAdded.Connect((player) => {
		task.spawn(() => {
			// Wait for profile to be loaded
			let profile = PlayerDataService.getProfile(player);
			for (let i = 0; i < 100 && !profile; i++) {
				task.wait(0.1);
				profile = PlayerDataService.getProfile(player);
			}
			if (!profile) return;
			restoreHotbar(player);
		});

		// Rebuild tools after respawn — Roblox clears Backpack on character reset
		player.CharacterAdded.Connect(() => {
			task.spawn(() => restoreHotbar(player));
		});
	});

	Players.PlayerRemoving.Connect((player) => {
		activeItems.delete(player);
	});

	print("[HotbarService] Initialized");
}
