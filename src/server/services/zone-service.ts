import { CollectionService, Players, Workspace } from "@rbxts/services";
import { ZoneConfigs, DEFAULT_ZONE_NAME } from "shared/data/zones";
import { fireClient } from "server/network/server-network";
import * as GameLoopService from "./game-loop-service";

const ZONE_TAG = "Zone";
const CHECK_INTERVAL = 0.5; // Check zone every 0.5s, not every frame

// --- Types ---

interface ZoneState {
	zoneId: string;
	configId: string;
	instance: BasePart;
}

// --- State ---

const zones = new Map<string, ZoneState>();
const playerZones = new Map<Player, string>();
let lastCheckTime = 0;
let zoneIdCounter = 0;

// --- Public API ---

/** Get the current zone a player is in. */
export function getPlayerZone(player: Player): string | undefined {
	return playerZones.get(player);
}

// --- Internal ---

function registerZone(instance: BasePart, configId: string): void {
	const config = ZoneConfigs[configId];
	if (!config) {
		warn(`[ZoneService] Unknown zone config: ${configId}`);
		return;
	}

	zoneIdCounter++;
	const zoneId = `zone_${zoneIdCounter}`;

	instance.SetAttribute("ZoneId", zoneId);
	instance.SetAttribute("ZoneConfigId", configId);

	zones.set(zoneId, {
		zoneId,
		configId,
		instance,
	});
}

/** Check if a point is inside a BasePart's bounding box. */
function isPointInPart(point: Vector3, part: BasePart): boolean {
	const localPoint = part.CFrame.PointToObjectSpace(point);
	const halfSize = part.Size.mul(0.5);
	return (
		math.abs(localPoint.X) <= halfSize.X &&
		math.abs(localPoint.Y) <= halfSize.Y &&
		math.abs(localPoint.Z) <= halfSize.Z
	);
}

/** Find which zone a position is in. Returns the configId or undefined. */
function findZoneAtPosition(position: Vector3): string | undefined {
	for (const [, zone] of zones) {
		if (isPointInPart(position, zone.instance)) {
			return zone.configId;
		}
	}
	return undefined;
}

function update(_dt: number): void {
	const now = os.clock();
	if (now - lastCheckTime < CHECK_INTERVAL) return;
	lastCheckTime = now;

	for (const player of Players.GetPlayers()) {
		const rootPart = player.Character?.FindFirstChild("HumanoidRootPart") as Part | undefined;
		if (!rootPart) continue;

		const newZoneConfigId = findZoneAtPosition(rootPart.Position);
		const currentZoneConfigId = playerZones.get(player);

		if (newZoneConfigId !== currentZoneConfigId) {
			if (newZoneConfigId) {
				const config = ZoneConfigs[newZoneConfigId];
				if (config) {
					playerZones.set(player, newZoneConfigId);
					fireClient(player, "ZoneChanged", {
						zoneId: newZoneConfigId,
						zoneName: config.name,
						zoneType: config.zoneType,
					});
				}
			} else {
				playerZones.delete(player);
				fireClient(player, "ZoneChanged", {
					zoneId: "",
					zoneName: DEFAULT_ZONE_NAME,
					zoneType: "combat",
				});
			}
		}
	}
}

/** Create test zones if none are found. */
function createTestZones(): void {
	const testZones = [
		{ configId: "lumbridge_town", x: 10, z: 0, sizeX: 60, sizeZ: 60 },
		{ configId: "chicken_field", x: 0, z: 60, sizeX: 50, sizeZ: 50 },
		{ configId: "goblin_camp", x: 60, z: 60, sizeX: 50, sizeZ: 50 },
		{ configId: "mining_quarry", x: -30, z: 40, sizeX: 40, sizeZ: 40 },
		{ configId: "forest_clearing", x: -45, z: 30, sizeX: 40, sizeZ: 40 },
		{ configId: "skeleton_graveyard", x: 80, z: 0, sizeX: 50, sizeZ: 50 },
	];

	for (const entry of testZones) {
		const config = ZoneConfigs[entry.configId];
		if (!config) continue;

		const part = new Instance("Part");
		part.Name = `Zone_${config.name}`;
		part.Anchored = true;
		part.CanCollide = false;
		part.Transparency = 1;
		part.Size = new Vector3(entry.sizeX, 100, entry.sizeZ);
		part.Position = new Vector3(entry.x, 50, entry.z);

		CollectionService.AddTag(part, ZONE_TAG);
		part.SetAttribute("ZoneConfigId", entry.configId);
		part.Parent = Workspace;
	}
}

// --- Initialize ---

export function initialize(): void {
	// Scan for tagged zones
	const taggedZones = CollectionService.GetTagged(ZONE_TAG);
	for (const instance of taggedZones) {
		const configId = instance.GetAttribute("ZoneConfigId") as string | undefined;
		if (configId && instance.IsA("BasePart")) {
			registerZone(instance, configId);
		}
	}

	// Listen for zones added at runtime
	CollectionService.GetInstanceAddedSignal(ZONE_TAG).Connect((instance) => {
		const configId = instance.GetAttribute("ZoneConfigId") as string | undefined;
		if (configId && instance.IsA("BasePart")) {
			registerZone(instance, configId);
		}
	});

	// If no zones found, create test ones
	if (zones.size() === 0) {
		print("[ZoneService] No zones found — creating test zones");
		createTestZones();
	}

	// Clean up on leave
	Players.PlayerRemoving.Connect((player) => {
		playerZones.delete(player);
	});

	GameLoopService.registerSystem("Zones", 30, update);

	print("[ZoneService] Initialized");
}
