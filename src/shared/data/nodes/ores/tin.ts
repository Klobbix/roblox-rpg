import { GatheringNodeConfig } from "../index";

export const TinConfigs: Record<string, GatheringNodeConfig> = {
	tin_rock: {
		id: "tin_rock",
		name: "Tin Rock",
		skillId: "mining",
		levelRequired: 1,
		expReward: 18,
		lootTableId: "tin_rock_loot",
		respawnTime: 8,
		toolRequired: true,
		hitsRequired: 3,
	},
};