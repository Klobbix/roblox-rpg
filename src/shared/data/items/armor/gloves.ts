import { ItemConfig, ItemRarity, ItemType } from "../types";
import { EquipmentSlot } from "../../../types";

export const GloveConfigs: Record<string, ItemConfig> = {
	leather_gloves: {
		id: "leather_gloves",
		name: "Leather Gloves",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Common,
		description: "Simple leather gloves.",
		stackable: false,
		maxStack: 1,
		sellPrice: 5,
		equipment: {
			equipSlot: EquipmentSlot.Hands,
			statBonuses: { attack: 1 },
			levelRequirement: 1,
		},
	},
};