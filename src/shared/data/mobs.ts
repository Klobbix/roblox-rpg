import { CombatStats } from "shared/types/player";

export interface MobConfig {
	id: string;
	name: string;
	level: number;
	stats: CombatStats;
	attackSpeed: number; // seconds between attacks
	aggroRange: number; // studs (0 = passive)
	leashRange: number; // studs from spawn before resetting
	attackRange: number; // studs to melee
	walkSpeed: number; // studs per second
	respawnTime: number; // seconds
	lootTableId: string;
}

export const MobConfigs: Record<string, MobConfig> = {
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
		lootTableId: "chicken_drops",
	},
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
		lootTableId: "skeleton_drops",
	},
};
