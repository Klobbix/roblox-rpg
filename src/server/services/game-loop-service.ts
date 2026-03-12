import { RunService } from "@rbxts/services";

interface GameSystem {
	name: string;
	priority: number;
	update: (dt: number) => void;
}

const systems: GameSystem[] = [];
let running = false;

/**
 * Register a system to run each server tick.
 * Lower priority numbers run first.
 */
export function registerSystem(
	name: string,
	priority: number,
	update: (dt: number) => void,
): void {
	systems.push({ name, priority, update });
	systems.sort((a, b) => a.priority < b.priority);
}

/** Remove a registered system by name. */
export function unregisterSystem(name: string): void {
	const idx = systems.findIndex((s) => s.name === name);
	if (idx !== -1) {
		systems.unorderedRemove(idx);
		systems.sort((a, b) => a.priority < b.priority);
	}
}

/** Start the server game loop. Call after all initial systems are registered. */
export function initialize(): void {
	if (running) return;
	running = true;

	RunService.Heartbeat.Connect((dt: number) => {
		for (const system of systems) {
			system.update(dt);
		}
	});

	print(`[GameLoop] Initialized with ${systems.size()} systems`);
}
