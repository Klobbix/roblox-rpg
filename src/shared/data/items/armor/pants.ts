import { ItemConfig, ItemRarity, ItemType } from "../types";
import { EquipmentSlot } from "../../../types";

export const PantConfigs: Record<string, ItemConfig> = {
	bronze_legs: {
		id: "bronze_legs",
		name: "Bronze Platelegs",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Common,
		description: "Bronze platelegs.",
		stackable: false,
		maxStack: 1,
		sellPrice: 12,
		equipment: {
			equipSlot: EquipmentSlot.Legs,
			statBonuses: { defense: 2 },
			levelRequirement: 1,
		},
	},
};