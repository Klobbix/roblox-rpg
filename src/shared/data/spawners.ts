export interface SpawnerConfig {
	id: string;
	mobId: string; // references MobConfig.id
	count: number; // max alive mobs for this spawner
	radius: number; // studs — spawn spread around center
	respawnDelay: number; // seconds after death before respawning
}

export const SpawnerConfigs: Record<string, SpawnerConfig> = {
	spawn_chickens: {
		id: "spawn_chickens",
		mobId: "chicken",
		count: 3,
		radius: 10,
		respawnDelay: 10,
	},
	spawn_goblins: {
		id: "spawn_goblins",
		mobId: "goblin",
		count: 4,
		radius: 15,
		respawnDelay: 15,
	},
	spawn_skeletons: {
		id: "spawn_skeletons",
		mobId: "skeleton",
		count: 2,
		radius: 12,
		respawnDelay: 20,
	},
};
