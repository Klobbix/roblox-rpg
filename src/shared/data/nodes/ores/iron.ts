import { GatheringNodeConfig } from "../index";

export const IronConfigs: Record<string, GatheringNodeConfig> = {
	iron_rock: {
		id: "iron_rock",
		name: "Iron Rock",
		skillId: "mining",
		levelRequired: 15,
		expReward: 35,
		respawnTime: 15,
		toolRequired: true,
		hitsRequired: 4,
		loot: {
			rolls: 1,
			entries: [{ itemId: "iron_ore", weight: 100, minQty: 1, maxQty: 1 }],
		},
	},
};
