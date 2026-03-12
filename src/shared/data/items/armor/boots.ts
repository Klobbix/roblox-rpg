import { ItemConfig, ItemRarity, ItemType } from "../types";
import { EquipmentSlot } from "../../../types";

export const BootConfigs: Record<string, ItemConfig> = {
	leather_boots: {
		id: "leather_boots",
		name: "Leather Boots",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Common,
		description: "Simple leather boots.",
		stackable: false,
		maxStack: 1,
		sellPrice: 5,
		equipment: {
			equipSlot: EquipmentSlot.Feet,
			statBonuses: { defense: 1 },
			levelRequirement: 1,
		},
	},
};