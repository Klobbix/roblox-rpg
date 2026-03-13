import { GatheringNodeConfig } from "../index";

export const TinConfigs: Record<string, GatheringNodeConfig> = {
	tin_rock: {
		id: "tin_rock",
		name: "Tin Rock",
		skillId: "mining",
		levelRequired: 1,
		expReward: 18,
		respawnTime: 8,
		toolRequired: true,
		hitsRequired: 3,
		loot: {
			rolls: 1,
			entries: [{ itemId: "tin_ore", weight: 100, minQty: 1, maxQty: 1 }],
		},
	},
};
