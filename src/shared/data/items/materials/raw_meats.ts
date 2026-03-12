import { ItemConfig, ItemRarity, ItemType } from "../types";

export const RawMeatConfigs: Record<string, ItemConfig> = {
	raw_chicken: {
		id: "raw_chicken",
		name: "Raw Chicken",
		itemType: ItemType.Material,
		rarity: ItemRarity.Common,
		description: "A piece of raw chicken meat.",
		stackable: true,
		maxStack: 99,
		sellPrice: 2,
	},
	raw_beef: {
		id: "raw_beef",
		name: "Raw Beef",
		itemType: ItemType.Material,
		rarity: ItemRarity.Common,
		description: "A piece of raw beef.",
		stackable: true,
		maxStack: 99,
		sellPrice: 2,
	},
};
