import { CombatStats, EquipmentSlot, InventoryTab } from "shared/types/player";
import { ItemConfig, ItemType } from "./types";
import { WeaponConfigs } from "./weapons";
import { ConsumableConfigs } from "./consumables";
import { MaterialConfigs } from "./materials";
import { ToolConfigs } from "./tools";
import { ArmorConfigs } from "./armor";
import { CurrencyConfigs } from "./currencies";

export * from "./types";

export const ItemConfigs: Record<string, ItemConfig> = {
	...WeaponConfigs,
	...ArmorConfigs,
	...ToolConfigs,
	...ConsumableConfigs,
	...MaterialConfigs,
	...CurrencyConfigs,
};

/** Map ItemType to the inventory tab it belongs in */
export function getItemTab(itemType: ItemType): InventoryTab {
	switch (itemType) {
		case ItemType.Equipment:
		case ItemType.Tool:
			return InventoryTab.Equip;
		case ItemType.Consumable:
			return InventoryTab.Use;
		case ItemType.Material:
		case ItemType.Quest:
		case ItemType.Currency:
			return InventoryTab.Etc;
	}
}

/** Get total stat bonuses from a set of equipped items */
export function getEquipmentBonuses(equipment: Partial<Record<EquipmentSlot, { itemId: string }>>): CombatStats {
	const bonuses: CombatStats = { maxHp: 0, attack: 0, strength: 0, defense: 0 };

	for (const [, item] of pairs(equipment)) {
		const config = ItemConfigs[item.itemId];
		if (!config?.equipment) continue;
		const sb = config.equipment.statBonuses;
		bonuses.maxHp += sb.maxHp ?? 0;
		bonuses.attack += sb.attack ?? 0;
		bonuses.strength += sb.strength ?? 0;
		bonuses.defense += sb.defense ?? 0;
	}

	return bonuses;
}

/** Get attack speed from the currently active hotbar item, or default */
export function getWeaponAttackSpeed(activeItemId: string | undefined, defaultSpeed: number): number {
	if (!activeItemId) return defaultSpeed;
	const config = ItemConfigs[activeItemId];
	if (!config?.equipment?.attackSpeed) return defaultSpeed;
	return config.equipment.attackSpeed;
}
