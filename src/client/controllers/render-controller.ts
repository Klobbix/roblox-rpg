import { RunService } from "@rbxts/services";

interface RenderSystem {
	name: string;
	priority: number;
	update: (dt: number) => void;
}

const systems: RenderSystem[] = [];
let running = false;

/**
 * Register a system to run each client render frame.
 * Lower priority numbers run first.
 * Runs on RenderStepped (before rendering).
 */
export function registerSystem(
	name: string,
	priority: number,
	update: (dt: number) => void,
): void {
	systems.push({ name, priority, update });
	systems.sort((a, b) => a.priority < b.priority);
}

/** Remove a registered render system by name. */
export function unregisterSystem(name: string): void {
	const idx = systems.findIndex((s) => s.name === name);
	if (idx !== -1) {
		systems.unorderedRemove(idx);
		systems.sort((a, b) => a.priority < b.priority);
	}
}

/** Start the client render loop. Call after all initial systems are registered. */
export function initialize(): void {
	if (running) return;
	running = true;

	RunService.RenderStepped.Connect((dt: number) => {
		for (const system of systems) {
			system.update(dt);
		}
	});

	print(`[RenderController] Initialized with ${systems.size()} systems`);
}
