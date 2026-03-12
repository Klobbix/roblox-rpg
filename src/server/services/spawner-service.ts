import { CollectionService, Workspace } from "@rbxts/services";
import { SpawnerConfig, SpawnerConfigs } from "shared/data/spawners";
import { MobConfigs } from "shared/data/mobs";
import * as MobService from "./mob-service";

const SPAWNER_TAG = "Spawner";

interface SpawnerState {
	configId: string;
	config: SpawnerConfig;
	position: Vector3;
	aliveMobIds: Set<string>;
	pendingRespawns: number;
}

const spawners = new Map<string, SpawnerState>();
let spawnerIdCounter = 0;

/** Register a spawner from a config at a position. */
function registerSpawner(position: Vector3, configId: string): void {
	const config = SpawnerConfigs[configId];
	if (!config) {
		warn(`[SpawnerService] Unknown spawner config: ${configId}`);
		return;
	}

	if (!MobConfigs[config.mobId]) {
		warn(`[SpawnerService] Spawner ${configId} references unknown mob: ${config.mobId}`);
		return;
	}

	spawnerIdCounter++;
	const spawnerId = `spawner_${spawnerIdCounter}`;

	const state: SpawnerState = {
		configId,
		config,
		position,
		aliveMobIds: new Set(),
		pendingRespawns: 0,
	};

	spawners.set(spawnerId, state);

	// Initial spawn
	for (let i = 0; i < config.count; i++) {
		spawnMobForSpawner(spawnerId, state);
	}

	print(`[SpawnerService] Registered ${spawnerId} (${config.mobId} x${config.count})`);
}

/** Spawn a single mob for a spawner at a random position within its radius. */
function spawnMobForSpawner(spawnerId: string, state: SpawnerState): void {
	const angle = math.random() * math.pi * 2;
	const dist = math.random() * state.config.radius;
	const offset = new Vector3(math.cos(angle) * dist, 0, math.sin(angle) * dist);
	const position = state.position.add(offset);

	const mobId = MobService.spawnMob(state.config.mobId, position, spawnerId);
	if (mobId !== "") {
		state.aliveMobIds.add(mobId);
	}
}

/** Called when a mob dies — schedules respawn. */
function onMobDeath(mobId: string, spawnerId: string | undefined): void {
	if (!spawnerId) return;

	const state = spawners.get(spawnerId);
	if (!state) return;

	state.aliveMobIds.delete(mobId);

	// Schedule respawn
	state.pendingRespawns++;
	task.delay(state.config.respawnDelay, () => {
		state.pendingRespawns--;
		// Only respawn if we're still under the cap
		if (state.aliveMobIds.size() + state.pendingRespawns < state.config.count) {
			state.pendingRespawns++; // re-increment since we're about to decrement
		}
		spawnMobForSpawner(spawnerId, state);
	});
}

/**
 * Create test spawners programmatically for development.
 * Places spawners in a line near the origin.
 */
export function createTestSpawners(): void {
	const configs = ["spawn_chickens", "spawn_goblins", "spawn_skeletons"];
	let xOffset = 0;

	for (const configId of configs) {
		const position = new Vector3(xOffset, 5, 20);
		registerSpawner(position, configId);
		xOffset += 40;
	}

	print("[SpawnerService] Created test spawners");
}

export function initialize(): void {
	// Wire up mob death callback
	MobService.setMobDeathCallback(onMobDeath);

	// Scan for tagged spawner Parts in the workspace
	const spawnerParts = CollectionService.GetTagged(SPAWNER_TAG);
	for (const part of spawnerParts) {
		const configId = part.GetAttribute("SpawnerConfigId") as string | undefined;
		if (configId && part.IsA("BasePart")) {
			registerSpawner(part.Position, configId);
		}
	}

	// Listen for spawners added at runtime (e.g., placed in Studio during testing)
	CollectionService.GetInstanceAddedSignal(SPAWNER_TAG).Connect((instance) => {
		const configId = instance.GetAttribute("SpawnerConfigId") as string | undefined;
		if (configId && instance.IsA("BasePart")) {
			registerSpawner(instance.Position, configId);
		}
	});

	// If no spawners were found, create test ones
	if (spawners.size() === 0) {
		print("[SpawnerService] No spawner Parts found — creating test spawners");
		createTestSpawners();
	}

	print("[SpawnerService] Initialized");
}
