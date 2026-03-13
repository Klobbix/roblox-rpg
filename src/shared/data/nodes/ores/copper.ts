import { GatheringNodeConfig } from "../index";

export const CopperConfigs: Record<string, GatheringNodeConfig> = {
	copper_rock: {
		id: "copper_rock",
		name: "Copper Rock",
		skillId: "mining",
		levelRequired: 1,
		expReward: 18,
		respawnTime: 8,
		toolRequired: true,
		hitsRequired: 3,
		loot: {
			rolls: 1,
			entries: [{ itemId: "copper_ore", weight: 100, minQty: 1, maxQty: 1 }],
		},
	},
};
