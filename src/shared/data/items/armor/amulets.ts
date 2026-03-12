import { ItemConfig, ItemRarity, ItemType } from "../types";
import { EquipmentSlot } from "../../../types";

export const AmuletConfigs: Record<string, ItemConfig> = {
	bronze_amulet: {
		id: "bronze_amulet",
		name: "Bronze Amulet",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Common,
		description: "An amulet made of bronze.",
		stackable: false,
		maxStack: 1,
		sellPrice: 5,
		equipment: {
			equipSlot: EquipmentSlot.Amulet,
			statBonuses: { defense: 1 },
			levelRequirement: 1,
		},
	},
};