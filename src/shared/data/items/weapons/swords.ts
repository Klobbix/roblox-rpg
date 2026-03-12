import { ItemConfig, ItemRarity, ItemType } from "../types";
import { EquipmentSlot } from "../../../types";

export const SwordConfigs: Record<string, ItemConfig> = {
	bronze_sword: {
		id: "bronze_sword",
		name: "Bronze Sword",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Common,
		description: "A short bronze sword.",
		stackable: false,
		maxStack: 1,
		sellPrice: 10,
		equipment: {
			equipSlot: EquipmentSlot.Weapon,
			statBonuses: { attack: 2, strength: 1 },
			levelRequirement: 1,
			attackSpeed: 2.0,
		},
	},
	iron_sword: {
		id: "iron_sword",
		name: "Iron Sword",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Uncommon,
		description: "A sturdy iron sword.",
		stackable: false,
		maxStack: 1,
		sellPrice: 50,
		equipment: {
			equipSlot: EquipmentSlot.Weapon,
			statBonuses: { attack: 5, strength: 4 },
			levelRequirement: 5,
			attackSpeed: 2.4,
		},
	},
};