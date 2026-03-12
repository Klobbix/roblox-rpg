/** Data config for a gathering node type */
export interface GatheringNodeConfig {
	id: string;
	name: string;
	skillId: string;
	levelRequired: number;
	expReward: number;
	lootTableId: string;
	respawnTime: number;
	/** Tool itemType required (any tool for this skill works, better = faster) */
	toolRequired: boolean;
	/** Base gather time in seconds (modified by tool speed) */
	gatherTime: number;
}

export const GatheringNodeConfigs: Record<string, GatheringNodeConfig> = {
	// --- Mining ---
	copper_rock: {
		id: "copper_rock",
		name: "Copper Rock",
		skillId: "mining",
		levelRequired: 1,
		expReward: 18,
		lootTableId: "copper_rock_loot",
		respawnTime: 8,
		toolRequired: true,
		gatherTime: 3.0,
	},
	tin_rock: {
		id: "tin_rock",
		name: "Tin Rock",
		skillId: "mining",
		levelRequired: 1,
		expReward: 18,
		lootTableId: "tin_rock_loot",
		respawnTime: 8,
		toolRequired: true,
		gatherTime: 3.0,
	},
	iron_rock: {
		id: "iron_rock",
		name: "Iron Rock",
		skillId: "mining",
		levelRequired: 15,
		expReward: 35,
		lootTableId: "iron_rock_loot",
		respawnTime: 15,
		toolRequired: true,
		gatherTime: 4.0,
	},

	// --- Woodcutting ---
	normal_tree: {
		id: "normal_tree",
		name: "Tree",
		skillId: "woodcutting",
		levelRequired: 1,
		expReward: 25,
		lootTableId: "normal_tree_loot",
		respawnTime: 10,
		toolRequired: true,
		gatherTime: 3.0,
	},
	oak_tree: {
		id: "oak_tree",
		name: "Oak Tree",
		skillId: "woodcutting",
		levelRequired: 15,
		expReward: 38,
		lootTableId: "oak_tree_loot",
		respawnTime: 18,
		toolRequired: true,
		gatherTime: 4.5,
	},

	// --- Fishing ---
	fishing_spot: {
		id: "fishing_spot",
		name: "Fishing Spot",
		skillId: "fishing",
		levelRequired: 1,
		expReward: 20,
		lootTableId: "fishing_spot_loot",
		respawnTime: 5,
		toolRequired: true,
		gatherTime: 4.0,
	},
};
