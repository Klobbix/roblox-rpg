import { ItemConfig, ItemRarity, ItemType } from "./types";

export const CurrencyConfigs: Record<string, ItemConfig> = {
	gold_coins: {
		id: "gold_coins",
		name: "Gold Coins",
		itemType: ItemType.Currency,
		rarity: ItemRarity.Common,
		description: "A small pile of gold coins.",
		stackable: true,
		maxStack: 9999,
		sellPrice: 0,
	},
};