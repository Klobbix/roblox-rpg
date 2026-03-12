import { ItemConfig, ItemRarity, ItemType } from "../types";

export const OreConfigs: Record<string, ItemConfig> = {
	copper_ore: {
		id: "copper_ore",
		name: "Copper Ore",
		itemType: ItemType.Material,
		rarity: ItemRarity.Common,
		description: "A chunk of copper ore.",
		stackable: true,
		maxStack: 99,
		sellPrice: 5,
	},
	tin_ore: {
		id: "tin_ore",
		name: "Tin Ore",
		itemType: ItemType.Material,
		rarity: ItemRarity.Common,
		description: "A chunk of tin ore.",
		stackable: true,
		maxStack: 99,
		sellPrice: 5,
	},
	iron_ore: {
		id: "iron_ore",
		name: "Iron Ore",
		itemType: ItemType.Material,
		rarity: ItemRarity.Uncommon,
		description: "A chunk of iron ore.",
		stackable: true,
		maxStack: 99,
		sellPrice: 15,
	},
};