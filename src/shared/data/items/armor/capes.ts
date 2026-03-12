import { ItemConfig, ItemRarity, ItemType } from "../types";
import { EquipmentSlot } from "../../../types";

export const CapeConfigs: Record<string, ItemConfig> = {
	leather_gloves: {
		id: "leather_gloves",
		name: "Leather Gloves",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Common,
		description: "Simple leather cape.",
		stackable: false,
		maxStack: 1,
		sellPrice: 5,
		equipment: {
			equipSlot: EquipmentSlot.Cape,
			statBonuses: { attack: 1 },
			levelRequirement: 1,
		},
	},
};