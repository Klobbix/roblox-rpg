import { EquipmentSlot, InventoryItem, InventoryTab } from "shared/types/player";
import { ItemConfigs } from "shared/data/items";
import { fireClient } from "server/network/server-network";
import * as PlayerDataService from "./player-data-service";
import * as InventoryService from "./inventory-service";

/** Callback for when equipment changes, set by CombatService */
type EquipmentChangeCallback = (player: Player) => void;
let onEquipmentChanged: EquipmentChangeCallback = () => {};

export function setEquipmentChangeCallback(cb: EquipmentChangeCallback): void {
	onEquipmentChanged = cb;
}

/**
 * Equip an item from the Equip inventory tab.
 * Validates: item exists, is equipment, is not a weapon (weapons use the hotbar), player meets level requirement.
 * If a slot is already occupied, swaps the old item back to inventory.
 */
export function equipItem(player: Player, slotIndex: number): boolean {
	const profile = PlayerDataService.getProfile(player);
	if (!profile) return false;

	const tabData = profile.inventory[InventoryTab.Equip];
	if (slotIndex < 0 || slotIndex >= tabData.slotCount) return false;

	const slot = tabData.slots[slotIndex];
	if (slot === undefined) return false;

	const config = ItemConfigs[slot.itemId];
	if (!config || !config.equipment) {
		fireClient(player, "EquipFailed", { reason: "Not an equippable item." });
		return false;
	}

	const equipData = config.equipment;

	// Weapons go to the hotbar, not the equipment panel
	if (equipData.equipSlot === EquipmentSlot.Weapon) {
		fireClient(player, "EquipFailed", { reason: "Weapons are assigned via the hotbar." });
		return false;
	}

	// Level requirement check
	if (profile.combatLevel < equipData.levelRequirement) {
		fireClient(player, "EquipFailed", {
			reason: `Requires combat level ${equipData.levelRequirement}. You are level ${profile.combatLevel}.`,
		});
		return false;
	}

	const targetSlot = equipData.equipSlot;

	// Remove item from inventory
	tabData.slots[slotIndex] = undefined;

	// If something is already equipped in that slot, put it back in inventory
	const currentlyEquipped = profile.equipment[targetSlot];
	if (currentlyEquipped !== undefined) {
		// Place old item into the slot we just freed
		tabData.slots[slotIndex] = { itemId: currentlyEquipped.itemId, quantity: 1 };
	}

	// Equip the new item
	profile.equipment[targetSlot] = { itemId: slot.itemId, quantity: 1 };

	syncEquipment(player);
	InventoryService.syncAllTabs(player);
	onEquipmentChanged(player);

	return true;
}

/**
 * Unequip an item from an equipment slot back to the Equip inventory tab.
 * Fails if inventory is full.
 */
export function unequipItem(player: Player, equipSlot: EquipmentSlot): boolean {
	const profile = PlayerDataService.getProfile(player);
	if (!profile) return false;

	const equipped = profile.equipment[equipSlot];
	if (equipped === undefined) return false;

	// Check if Equip tab has room
	if (!InventoryService.canAddItem(player, equipped.itemId, 1)) {
		fireClient(player, "EquipFailed", { reason: "Equip tab is full." });
		return false;
	}

	// Remove from equipment
	delete profile.equipment[equipSlot];

	// Add back to Equip inventory tab
	InventoryService.addItem(player, equipped.itemId, 1);

	syncEquipment(player);
	onEquipmentChanged(player);

	return true;
}

function syncEquipment(player: Player): void {
	const profile = PlayerDataService.getProfile(player);
	if (!profile) return;
	fireClient(player, "EquipmentUpdated", { equipment: profile.equipment });
}

export function initialize(): void {
	print("[EquipmentService] Initialized");
}
