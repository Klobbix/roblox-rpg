import { MobConfig } from "./index";

export const SkeletonConfigs: Record<string, MobConfig> = {
	skeleton: {
		id: "skeleton",
		name: "Skeleton",
		level: 6,
		stats: { maxHp: 30, attack: 8, strength: 6, defense: 5 },
		attackSpeed: 3.0,
		aggroRange: 10,
		leashRange: 35,
		attackRange: 5,
		walkSpeed: 12,
		respawnTime: 20,
		loot: {
			rolls: 2,
			entries: [
				{ itemId: "bones", weight: 100, minQty: 1, maxQty: 2 },
				{ itemId: "gold_coins", weight: 70, minQty: 5, maxQty: 25 },
				{ itemId: "iron_sword", weight: 8, minQty: 1, maxQty: 1 },
				{ itemId: "skull", weight: 25, minQty: 1, maxQty: 1 },
			],
		},
	},
};
