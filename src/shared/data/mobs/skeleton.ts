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
		lootTableId: "skeleton_drops",
	},
};
