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
		lootTableId: "goblin_drops",
	},
};