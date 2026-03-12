import { ItemConfig, ItemRarity, ItemType } from "../types";

export const PotionConfigs: Record<string, ItemConfig> = {
	red_potion: {
		id: "red_potion",
		name: "Red Potion",
		itemType: ItemType.Consumable,
		rarity: ItemRarity.Common,
		description: "A basic healing potion.",
		stackable: false,
		maxStack: 1,
		sellPrice: 10,
	},
};
