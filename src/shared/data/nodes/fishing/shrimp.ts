import { GatheringNodeConfig } from "../index";

export const ShrimpNodeConfigs: Record<string, GatheringNodeConfig> = {
	copper_rock: {
		id: "copper_rock",
		name: "Copper Rock",
		skillId: "mining",
		levelRequired: 1,
		expReward: 18,
		lootTableId: "copper_rock_loot",
		respawnTime: 8,
		toolRequired: true,
		hitsRequired: 3,
	},
};