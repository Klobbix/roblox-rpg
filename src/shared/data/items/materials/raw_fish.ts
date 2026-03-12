import { ItemConfig, ItemRarity, ItemType } from "../types";

export const RawFishConfigs: Record<string, ItemConfig> = {
	raw_shrimp: {
		id: "raw_shrimp",
		name: "Raw Shrimp",
		itemType: ItemType.Material,
		rarity: ItemRarity.Common,
		description: "A freshly caught shrimp.",
		stackable: true,
		maxStack: 99,
		sellPrice: 3,
	},
	raw_trout: {
		id: "raw_trout",
		name: "Raw Trout",
		itemType: ItemType.Material,
		rarity: ItemRarity.Uncommon,
		description: "A freshly caught trout.",
		stackable: true,
		maxStack: 99,
		sellPrice: 10,
	},
};
