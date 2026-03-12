export enum EntityType {
	Mob = "Mob",
	NPC = "NPC",
	GatherNode = "GatherNode",
}

/** Runtime entity data tracked by the entity service */
export interface EntityData {
	entityType: EntityType;
	configId: string;
	instance: Model;
	spawnPosition: Vector3;
	alive: boolean;
}
