import { ItemConfig, ItemRarity, ItemType } from "../types";
import { EquipmentSlot } from "../../../types";

export const HelmetConfigs: Record<string, ItemConfig> = {
	bronze_helm: {
		id: "bronze_helm",
		name: "Bronze Helm",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Common,
		description: "A simple bronze helmet.",
		stackable: false,
		maxStack: 1,
		sellPrice: 8,
		equipment: {
			equipSlot: EquipmentSlot.Head,
			statBonuses: { defense: 2 },
			levelRequirement: 1,
		},
	},
};