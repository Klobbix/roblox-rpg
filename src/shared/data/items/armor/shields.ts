import { ItemConfig, ItemRarity, ItemType } from "../types";
import { EquipmentSlot } from "../../../types";

export const ShieldConfigs: Record<string, ItemConfig> = {
	bronze_shield: {
		id: "bronze_shield",
		name: "Bronze Shield",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Common,
		description: "A simple bronze shield.",
		stackable: false,
		maxStack: 1,
		sellPrice: 8,
		equipment: {
			equipSlot: EquipmentSlot.Head,
			statBonuses: { defense: 2 },
			levelRequirement: 1,
		},
	},
	iron_shield: {
		id: "iron_shield",
		name: "Iron Shield",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Uncommon,
		description: "A sturdy iron shield.",
		stackable: false,
		maxStack: 1,
		sellPrice: 40,
		equipment: {
			equipSlot: EquipmentSlot.Shield,
			statBonuses: { defense: 5 },
			levelRequirement: 5,
		},
	},
};