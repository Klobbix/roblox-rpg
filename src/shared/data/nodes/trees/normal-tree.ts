import { GatheringNodeConfig } from "../index";

export const NormalTreeConfigs: Record<string, GatheringNodeConfig> = {
	normal_tree: {
		id: "normal_tree",
		name: "Tree",
		skillId: "woodcutting",
		levelRequired: 1,
		expReward: 25,
		lootTableId: "normal_tree_loot",
		respawnTime: 10,
		toolRequired: true,
		hitsRequired: 3,
	},
};