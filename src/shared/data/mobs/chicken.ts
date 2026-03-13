import { MobConfig } from "./index";

export const ChickenConfigs: Record<string, MobConfig> = {
	chicken: {
		id: "chicken",
		name: "Chicken",
		level: 1,
		stats: { maxHp: 5, attack: 1, strength: 1, defense: 1 },
		attackSpeed: 2.4,
		aggroRange: 0,
		leashRange: 20,
		attackRange: 4,
		walkSpeed: 6,
		respawnTime: 10,
		loot: {
			rolls: 1,
			entries: [
				{ itemId: "raw_chicken", weight: 80, minQty: 1, maxQty: 1 },
				{ itemId: "feather", weight: 60, minQty: 1, maxQty: 3 },
			],
		},
		spawners: [{ id: "spawn_chickens", count: 3, radius: 10, respawnDelay: 10 }],
	},
};
