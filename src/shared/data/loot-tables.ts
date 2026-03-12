/** A single entry in a loot table */
export interface LootTableEntry {
	itemId: string;
	/** Relative weight for weighted random selection */
	weight: number;
	minQty: number;
	maxQty: number;
}

/** A loot table with a set of possible drops */
export interface LootTableConfig {
	id: string;
	/** How many rolls to make on this table per kill */
	rolls: number;
	entries: LootTableEntry[];
}

export const LootTableConfigs: Record<string, LootTableConfig> = {
	chicken_drops: {
		id: "chicken_drops",
		rolls: 1,
		entries: [
			{ itemId: "raw_chicken", weight: 80, minQty: 1, maxQty: 1 },
			{ itemId: "feather", weight: 60, minQty: 1, maxQty: 3 },
		],
	},
	goblin_drops: {
		id: "goblin_drops",
		rolls: 2,
		entries: [
			{ itemId: "gold_coins", weight: 90, minQty: 3, maxQty: 12 },
			{ itemId: "goblin_mail", weight: 15, minQty: 1, maxQty: 1 },
			{ itemId: "bronze_dagger", weight: 20, minQty: 1, maxQty: 1 },
			{ itemId: "bones", weight: 50, minQty: 1, maxQty: 1 },
		],
	},
	skeleton_drops: {
		id: "skeleton_drops",
		rolls: 2,
		entries: [
			{ itemId: "bones", weight: 100, minQty: 1, maxQty: 2 },
			{ itemId: "gold_coins", weight: 70, minQty: 5, maxQty: 25 },
			{ itemId: "iron_sword", weight: 8, minQty: 1, maxQty: 1 },
			{ itemId: "skull", weight: 25, minQty: 1, maxQty: 1 },
		],
	},

	// --- Gathering node loot ---
	copper_rock_loot: {
		id: "copper_rock_loot",
		rolls: 1,
		entries: [{ itemId: "copper_ore", weight: 100, minQty: 1, maxQty: 1 }],
	},
	tin_rock_loot: {
		id: "tin_rock_loot",
		rolls: 1,
		entries: [{ itemId: "tin_ore", weight: 100, minQty: 1, maxQty: 1 }],
	},
	iron_rock_loot: {
		id: "iron_rock_loot",
		rolls: 1,
		entries: [{ itemId: "iron_ore", weight: 100, minQty: 1, maxQty: 1 }],
	},
	normal_tree_loot: {
		id: "normal_tree_loot",
		rolls: 1,
		entries: [{ itemId: "logs", weight: 100, minQty: 1, maxQty: 1 }],
	},
	oak_tree_loot: {
		id: "oak_tree_loot",
		rolls: 1,
		entries: [{ itemId: "oak_logs", weight: 100, minQty: 1, maxQty: 1 }],
	},
	fishing_spot_loot: {
		id: "fishing_spot_loot",
		rolls: 1,
		entries: [
			{ itemId: "raw_shrimp", weight: 70, minQty: 1, maxQty: 1 },
			{ itemId: "raw_trout", weight: 30, minQty: 1, maxQty: 1 },
		],
	},
};
