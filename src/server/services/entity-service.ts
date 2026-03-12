import { CollectionService } from "@rbxts/services";
import { EntityType, EntityData } from "shared/types/entity";

/** Tag prefix used in CollectionService. Entity tags are "Entity_Mob", "Entity_NPC", etc. */
const TAG_PREFIX = "Entity_";

const entities = new Map<Instance, EntityData>();

// --- Object Pool ---

const pools = new Map<string, Instance[]>();

/** Get or create a pool for a template ID. */
function getPool(templateId: string): Instance[] {
	let pool = pools.get(templateId);
	if (!pool) {
		pool = [];
		pools.set(templateId, pool);
	}
	return pool;
}

/** Acquire an instance from the pool, or clone the template if empty. */
export function acquireFromPool(templateId: string, template: Instance): Instance {
	const pool = getPool(templateId);
	const instance = pool.pop();

	if (instance) {
		return instance;
	}

	return template.Clone();
}

/** Return an instance to the pool for reuse. */
export function releaseToPool(templateId: string, instance: Instance): void {
	const pool = getPool(templateId);

	// Remove from workspace so it's not visible
	instance.Parent = undefined;
	pool.push(instance);
}

// --- Entity Registry ---

/** Register a model as a tracked entity. Adds a CollectionService tag. */
export function registerEntity(
	instance: Model,
	entityType: EntityType,
	configId: string,
): EntityData {
	const primaryPart = instance.PrimaryPart;
	const spawnPosition = primaryPart ? primaryPart.Position : new Vector3(0, 0, 0);

	const data: EntityData = {
		entityType,
		configId,
		instance,
		spawnPosition,
		alive: true,
	};

	entities.set(instance, data);
	CollectionService.AddTag(instance, `${TAG_PREFIX}${entityType}`);

	return data;
}

/** Unregister an entity and remove its tag. */
export function unregisterEntity(instance: Instance): void {
	const data = entities.get(instance);
	if (data) {
		CollectionService.RemoveTag(instance, `${TAG_PREFIX}${data.entityType}`);
		entities.delete(instance);
	}
}

/** Get entity data for an instance. */
export function getEntity(instance: Instance): EntityData | undefined {
	return entities.get(instance);
}

/** Get all entities of a specific type. */
export function getEntitiesByType(entityType: EntityType): EntityData[] {
	const result: EntityData[] = [];
	entities.forEach((data) => {
		if (data.entityType === entityType) {
			result.push(data);
		}
	});
	return result;
}

/** Get all tagged instances for an entity type via CollectionService. */
export function getTaggedInstances(entityType: EntityType): Instance[] {
	return CollectionService.GetTagged(`${TAG_PREFIX}${entityType}`);
}

/** Listen for new instances tagged with an entity type. */
export function onEntityTagAdded(
	entityType: EntityType,
	callback: (instance: Instance) => void,
): RBXScriptConnection {
	return CollectionService.GetInstanceAddedSignal(`${TAG_PREFIX}${entityType}`).Connect(callback);
}

/** Listen for instances losing an entity type tag. */
export function onEntityTagRemoved(
	entityType: EntityType,
	callback: (instance: Instance) => void,
): RBXScriptConnection {
	return CollectionService.GetInstanceRemovedSignal(`${TAG_PREFIX}${entityType}`).Connect(
		callback,
	);
}

export function initialize(): void {
	print("[EntityService] Initialized");
}
