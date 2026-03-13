import { GatheringNodeConfig } from "../index";

export const NormalTreeConfigs: Record<string, GatheringNodeConfig> = {
	normal_tree: {
		id: "normal_tree",
		name: "Tree",
		skillId: "woodcutting",
		levelRequired: 1,
		expReward: 25,
		respawnTime: 10,
		toolRequired: true,
		hitsRequired: 3,
		loot: {
			rolls: 1,
			entries: [{ itemId: "logs", weight: 100, minQty: 1, maxQty: 1 }],
		},
	},
};
