import { GatheringNodeConfig } from "../index";

export const IronConfigs: Record<string, GatheringNodeConfig> = {
	iron_rock: {
		id: "iron_rock",
		name: "Iron Rock",
		skillId: "mining",
		levelRequired: 15,
		expReward: 35,
		lootTableId: "iron_rock_loot",
		respawnTime: 15,
		toolRequired: true,
		hitsRequired: 4,
	},
};