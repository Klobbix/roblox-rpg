import { CombatStats } from "shared/types/player";
import { ChickenConfigs } from "./chicken";

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
	...ChickenConfigs,
};
