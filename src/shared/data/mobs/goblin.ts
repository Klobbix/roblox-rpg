import { MobConfig } from "./index";

export const GoblinConfigs: Record<string, MobConfig> = {
	goblin: {
		id: "goblin",
		name: "Goblin",
		level: 3,
		stats: { maxHp: 15, attack: 4, strength: 3, defense: 2 },
		attackSpeed: 2.4,
		aggroRange: 8,
		leashRange: 30,
		attackRange: 5,
		walkSpeed: 10,
		respawnTime: 15,
		loot: {
			rolls: 2,
			entries: [
				{ itemId: "gold_coins", weight: 90, minQty: 3, maxQty: 12 },
				{ itemId: "goblin_mail", weight: 15, minQty: 1, maxQty: 1 },
				{ itemId: "bronze_dagger", weight: 20, minQty: 1, maxQty: 1 },
				{ itemId: "bones", weight: 50, minQty: 1, maxQty: 1 },
			],
		},
	},
};
