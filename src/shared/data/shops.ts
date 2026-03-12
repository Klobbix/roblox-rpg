/** A single item listing in a shop */
export interface ShopItem {
	itemId: string;
	/** Buy price in gold */
	buyPrice: number;
	/** Maximum stock. undefined = unlimited */
	stock?: number;
}

/** Definition for a merchant shop */
export interface ShopConfig {
	id: string;
	name: string;
	items: ShopItem[];
}

/** Sell price multiplier — players receive this fraction of the buy price when selling */
export const SELL_PRICE_MULTIPLIER = 0.4;

export const ShopConfigs: Record<string, ShopConfig> = {
	general_store: {
		id: "general_store",
		name: "General Store",
		items: [
			{ itemId: "bronze_pickaxe", buyPrice: 25 },
			{ itemId: "bronze_hatchet", buyPrice: 25 },
			{ itemId: "fishing_rod", buyPrice: 25 },
			{ itemId: "bronze_dagger", buyPrice: 20 },
			{ itemId: "bronze_helm", buyPrice: 15 },
			{ itemId: "leather_boots", buyPrice: 10 },
			{ itemId: "leather_gloves", buyPrice: 10 },
			{ itemId: "bronze_legs", buyPrice: 25 },
		],
	},
	weapon_shop: {
		id: "weapon_shop",
		name: "Weapon Smith",
		items: [
			{ itemId: "bronze_dagger", buyPrice: 20 },
			{ itemId: "iron_sword", buyPrice: 150 },
			{ itemId: "bronze_helm", buyPrice: 15 },
			{ itemId: "goblin_mail", buyPrice: 40 },
			{ itemId: "iron_platebody", buyPrice: 250 },
			{ itemId: "iron_shield", buyPrice: 120 },
			{ itemId: "bronze_legs", buyPrice: 25 },
			{ itemId: "iron_pickaxe", buyPrice: 150 },
			{ itemId: "iron_hatchet", buyPrice: 150 },
		],
	},
};
