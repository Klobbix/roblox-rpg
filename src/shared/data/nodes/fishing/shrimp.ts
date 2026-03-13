import { GatheringNodeConfig } from "../index";

export const ShrimpNodeConfigs: Record<string, GatheringNodeConfig> = {
	fishing_spot: {
		id: "fishing_spot",
		name: "Fishing Spot",
		skillId: "fishing",
		levelRequired: 1,
		expReward: 20,
		respawnTime: 5,
		toolRequired: true,
		hitsRequired: 4,
		loot: {
			rolls: 1,
			entries: [
				{ itemId: "raw_shrimp", weight: 70, minQty: 1, maxQty: 1 },
				{ itemId: "raw_trout", weight: 30, minQty: 1, maxQty: 1 },
			],
		},
	},
};
