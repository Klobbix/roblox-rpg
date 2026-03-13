import { GatheringNodeConfig } from "../index";

export const OakTreeConfigs: Record<string, GatheringNodeConfig> = {
	oak_tree: {
		id: "oak_tree",
		name: "Oak Tree",
		skillId: "woodcutting",
		levelRequired: 15,
		expReward: 38,
		lootTableId: "oak_tree_loot",
		respawnTime: 18,
		toolRequired: true,
		hitsRequired: 5,
	},
};