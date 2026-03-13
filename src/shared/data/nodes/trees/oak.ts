import { GatheringNodeConfig } from "../index";

export const OakTreeConfigs: Record<string, GatheringNodeConfig> = {
	oak_tree: {
		id: "oak_tree",
		name: "Oak Tree",
		skillId: "woodcutting",
		levelRequired: 15,
		expReward: 38,
		respawnTime: 18,
		toolRequired: true,
		hitsRequired: 5,
		loot: {
			rolls: 1,
			entries: [{ itemId: "oak_logs", weight: 100, minQty: 1, maxQty: 1 }],
		},
	},
};
