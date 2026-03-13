import { CombatStats } from "shared/types/player";
import { LootTable } from "shared/data/loot-tables";
import { ChickenConfigs } from "./chicken";
import { GoblinConfigs } from "./goblin";
import { SkeletonConfigs } from "./skeleton";

export interface SpawnerEntry {
	id: string;
	count: number; // max alive mobs for this spawner
	radius: number; // studs — spawn spread around center
	respawnDelay: number; // seconds after death before respawning
}

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
	loot: LootTable;
	spawners: SpawnerEntry[];
}

export const MobConfigs: Record<string, MobConfig> = {
	...ChickenConfigs,
	...GoblinConfigs,
	...SkeletonConfigs,
};
