import { ItemConfig, ItemRarity, ItemType } from "../types";

export const LogConfigs: Record<string, ItemConfig> = {
	logs: {
		id: "logs",
		name: "Logs",
		itemType: ItemType.Material,
		rarity: ItemRarity.Common,
		description: "A bundle of normal logs.",
		stackable: true,
		maxStack: 99,
		sellPrice: 4,
	},
	oak_logs: {
		id: "oak_logs",
		name: "Oak Logs",
		itemType: ItemType.Material,
		rarity: ItemRarity.Uncommon,
		description: "A bundle of sturdy oak logs.",
		stackable: true,
		maxStack: 99,
		sellPrice: 12,
	},
};