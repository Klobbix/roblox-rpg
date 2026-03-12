import { Players } from "@rbxts/services";
import {
	InventoryItem,
	InventoryTab,
	TabInventory,
	MAX_TAB_SLOTS,
	SLOTS_PER_EXPANSION,
	INVENTORY_TABS,
} from "shared/types/player";
import { ItemConfigs, getItemTab } from "shared/data/items";
import { fireClient } from "server/network/server-network";
import * as PlayerDataService from "./player-data-service";

// --- Public API ---

/** Try to add an item to the correct tab. Returns true if successful. */
export function addItem(player: Player, itemId: string, quantity: number): boolean {
	const config = ItemConfigs[itemId];
	if (!config) {
		warn(`[InventoryService] Unknown item: ${itemId}`);
		return false;
	}

	const profile = PlayerDataService.getProfile(player);
	if (!profile) return false;

	const tab = getItemTab(config.itemType);
	const tabData = profile.inventory[tab];

	let remaining = quantity;

	// If stackable, try to fill existing stacks first
	if (config.stackable) {
		for (let i = 0; i < tabData.slotCount; i++) {
			if (remaining <= 0) break;
			const slot = tabData.slots[i];
			if (slot !== undefined && slot.itemId === itemId && slot.quantity < config.maxStack) {
				const canAdd = math.min(remaining, config.maxStack - slot.quantity);
				slot.quantity += canAdd;
				remaining -= canAdd;
			}
		}
	}

	// Place remaining into empty slots
	while (remaining > 0) {
		const emptySlot = findEmptySlot(tabData);
		if (emptySlot === -1) {
			fireClient(player, "InventoryFull", { itemId, tab });
			if (remaining < quantity) {
				syncTab(player, tab);
			}
			return false;
		}

		const stackSize = config.stackable ? math.min(remaining, config.maxStack) : 1;
		tabData.slots[emptySlot] = { itemId, quantity: stackSize };
		remaining -= stackSize;
	}

	syncTab(player, tab);
	return true;
}

/** Remove a quantity of an item from any tab. Returns true if successful. */
export function removeItem(player: Player, itemId: string, quantity: number): boolean {
	const config = ItemConfigs[itemId];
	if (!config) return false;

	const profile = PlayerDataService.getProfile(player);
	if (!profile) return false;

	const tab = getItemTab(config.itemType);
	const tabData = profile.inventory[tab];

	let available = 0;
	for (let i = 0; i < tabData.slotCount; i++) {
		const slot = tabData.slots[i];
		if (slot !== undefined && slot.itemId === itemId) {
			available += slot.quantity;
		}
	}
	if (available < quantity) return false;

	let remaining = quantity;
	for (let i = 0; i < tabData.slotCount; i++) {
		if (remaining <= 0) break;
		const slot = tabData.slots[i];
		if (slot !== undefined && slot.itemId === itemId) {
			const toRemove = math.min(remaining, slot.quantity);
			slot.quantity -= toRemove;
			remaining -= toRemove;
			if (slot.quantity <= 0) {
				tabData.slots[i] = undefined;
			}
		}
	}

	syncTab(player, tab);
	return true;
}

/** Remove an item from a specific tab and slot. Returns the removed item or undefined. */
export function removeFromSlot(
	player: Player,
	tab: InventoryTab,
	slotIndex: number,
	quantity: number,
): InventoryItem | undefined {
	const profile = PlayerDataService.getProfile(player);
	if (!profile) return undefined;

	const tabData = profile.inventory[tab];
	if (slotIndex < 0 || slotIndex >= tabData.slotCount) return undefined;

	const slot = tabData.slots[slotIndex];
	if (slot === undefined) return undefined;

	const toRemove = math.min(quantity, slot.quantity);
	const removed: InventoryItem = { itemId: slot.itemId, quantity: toRemove };

	slot.quantity -= toRemove;
	if (slot.quantity <= 0) {
		tabData.slots[slotIndex] = undefined;
	}

	syncTab(player, tab);
	return removed;
}

/** Move an item between slots within a tab. Handles stacking and swapping. */
export function moveItem(player: Player, tab: InventoryTab, fromSlot: number, toSlot: number): boolean {
	const profile = PlayerDataService.getProfile(player);
	if (!profile) return false;

	const tabData = profile.inventory[tab];
	if (fromSlot < 0 || fromSlot >= tabData.slotCount) return false;
	if (toSlot < 0 || toSlot >= tabData.slotCount) return false;
	if (fromSlot === toSlot) return false;

	const fromItem = tabData.slots[fromSlot];
	if (fromItem === undefined) return false;

	const toItem = tabData.slots[toSlot];

	if (toItem === undefined) {
		tabData.slots[toSlot] = fromItem;
		tabData.slots[fromSlot] = undefined;
		syncTab(player, tab);
		return true;
	}

	// Same stackable item — merge
	const config = ItemConfigs[fromItem.itemId];
	if (config && config.stackable && toItem.itemId === fromItem.itemId) {
		const canAdd = math.min(fromItem.quantity, config.maxStack - toItem.quantity);
		if (canAdd > 0) {
			toItem.quantity += canAdd;
			fromItem.quantity -= canAdd;
			if (fromItem.quantity <= 0) {
				tabData.slots[fromSlot] = undefined;
			}
			syncTab(player, tab);
			return true;
		}
	}

	// Swap
	tabData.slots[fromSlot] = toItem;
	tabData.slots[toSlot] = fromItem;
	syncTab(player, tab);
	return true;
}

/** Use a consumable item. Currently handles slot expansion scrolls. */
export function useItem(
	player: Player,
	tab: InventoryTab,
	slotIndex: number,
	targetTab: InventoryTab,
): boolean {
	const profile = PlayerDataService.getProfile(player);
	if (!profile) return false;

	const tabData = profile.inventory[tab];
	if (slotIndex < 0 || slotIndex >= tabData.slotCount) return false;

	const slot = tabData.slots[slotIndex];
	if (slot === undefined) return false;

	if (slot.itemId === "slot_expansion_scroll") {
		const targetTabData = profile.inventory[targetTab];
		if (targetTabData.slotCount >= MAX_TAB_SLOTS) {
			return false;
		}

		targetTabData.slotCount = math.min(targetTabData.slotCount + SLOTS_PER_EXPANSION, MAX_TAB_SLOTS);

		// Consume one scroll
		slot.quantity -= 1;
		if (slot.quantity <= 0) {
			tabData.slots[slotIndex] = undefined;
		}

		syncTab(player, tab);
		syncTab(player, targetTab);
		return true;
	}

	return false;
}

/** Check if a player has room for an item in the appropriate tab. */
export function canAddItem(player: Player, itemId: string, quantity: number): boolean {
	const config = ItemConfigs[itemId];
	if (!config) return false;

	const profile = PlayerDataService.getProfile(player);
	if (!profile) return false;

	const tab = getItemTab(config.itemType);
	const tabData = profile.inventory[tab];

	let remaining = quantity;

	if (config.stackable) {
		for (let i = 0; i < tabData.slotCount; i++) {
			const slot = tabData.slots[i];
			if (slot !== undefined && slot.itemId === itemId && slot.quantity < config.maxStack) {
				remaining -= config.maxStack - slot.quantity;
				if (remaining <= 0) return true;
			}
		}
	}

	let emptySlots = 0;
	for (let i = 0; i < tabData.slotCount; i++) {
		if (tabData.slots[i] === undefined) {
			emptySlots++;
		}
	}

	if (config.stackable) {
		return emptySlots >= math.ceil(remaining / config.maxStack);
	}

	return emptySlots >= remaining;
}

/** Add gold directly to player profile. */
export function addGold(player: Player, amount: number): void {
	PlayerDataService.updateProfile(player, (profile) => {
		profile.gold += amount;
	});
}

/** Send all tabs to the client (used on initial load). */
export function syncAllTabs(player: Player): void {
	for (const tab of INVENTORY_TABS) {
		syncTab(player, tab);
	}
}

// --- Internal ---

function findEmptySlot(tabData: TabInventory): number {
	for (let i = 0; i < tabData.slotCount; i++) {
		if (tabData.slots[i] === undefined) {
			return i;
		}
	}
	return -1;
}

function syncTab(player: Player, tab: InventoryTab): void {
	const profile = PlayerDataService.getProfile(player);
	if (!profile) return;
	fireClient(player, "InventoryTabUpdated", { tab, tabData: profile.inventory[tab] });
}

// --- Initialize ---

export function initialize(): void {
	Players.PlayerRemoving.Connect((_player) => {
		// Inventory persisted via PlayerDataService
	});

	print("[InventoryService] Initialized");
}
