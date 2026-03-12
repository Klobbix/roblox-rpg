import { CollectionService, Players, TeleportService, Workspace } from "@rbxts/services";
import { MapConfigs } from "shared/data/maps";
import { fireClient } from "server/network/server-network";
import * as PlayerDataService from "./player-data-service";

const PORTAL_TAG = "MapPortal";
const PORTAL_RANGE = 10;

// --- Types ---

interface PortalState {
	portalId: string;
	connectionId: string;
	mapId: string;
	instance: BasePart;
	position: Vector3;
}

// --- State ---

let portalIdCounter = 0;
const portals = new Map<string, PortalState>();

// --- Public API ---

/** Handle a player requesting teleport via a portal. */
export function requestTeleport(player: Player, portalId: string): void {
	const portal = portals.get(portalId);
	if (!portal) {
		fireClient(player, "TeleportFailed", { reason: "Portal not found." });
		return;
	}

	// Range check
	const rootPart = player.Character?.FindFirstChild("HumanoidRootPart") as Part | undefined;
	if (!rootPart) return;
	const distance = rootPart.Position.sub(portal.position).Magnitude;
	if (distance > PORTAL_RANGE) {
		fireClient(player, "TeleportFailed", { reason: "Too far from portal." });
		return;
	}

	const mapConfig = MapConfigs[portal.mapId];
	if (!mapConfig) return;

	const connection = mapConfig.connections[portal.connectionId];
	if (!connection) return;

	const targetMap = MapConfigs[connection.targetMapId];
	if (!targetMap) {
		fireClient(player, "TeleportFailed", { reason: "Target map not configured." });
		return;
	}

	// Save player data before teleport
	PlayerDataService.updateProfile(player, (profile) => {
		// Data is already up to date in memory
		// The save happens automatically
	});

	fireClient(player, "TeleportStarted", {
		targetMapId: connection.targetMapId,
		mapName: targetMap.name,
	});

	// If placeId is 0, this is a dev/same-place setup — just notify
	if (targetMap.placeId === 0) {
		task.delay(2, () => {
			fireClient(player, "TeleportFailed", {
				reason: `Teleport to "${targetMap.name}" requires a configured Place ID. Set placeId in MapConfigs.`,
			});
		});
		return;
	}

	// Perform actual teleport
	task.spawn(() => {
		const [success, err] = pcall(() => {
			// TeleportAsync with TeleportOptions for modern teleport API
			TeleportService.Teleport(targetMap.placeId, player);
		});

		if (!success) {
			warn(`[TeleportService] Failed to teleport ${player.Name}: ${err}`);
			fireClient(player, "TeleportFailed", { reason: "Teleport failed. Please try again." });
		}
	});
}

// --- Internal ---

function registerPortal(instance: BasePart, mapId: string, connectionId: string): void {
	const mapConfig = MapConfigs[mapId];
	if (!mapConfig) {
		warn(`[TeleportService] Unknown map: ${mapId}`);
		return;
	}

	if (!mapConfig.connections[connectionId]) {
		warn(`[TeleportService] Unknown connection: ${connectionId} in map ${mapId}`);
		return;
	}

	portalIdCounter++;
	const portalId = `portal_${portalIdCounter}`;

	instance.SetAttribute("PortalId", portalId);

	portals.set(portalId, {
		portalId,
		connectionId,
		mapId,
		instance,
		position: instance.Position,
	});

	// Add proximity prompt
	const existing = instance.FindFirstChildWhichIsA("ProximityPrompt");
	if (!existing) {
		const prompt = new Instance("ProximityPrompt");
		const targetMap = MapConfigs[mapConfig.connections[connectionId].targetMapId];
		prompt.ActionText = "Travel";
		prompt.ObjectText = targetMap ? targetMap.name : "Unknown";
		prompt.MaxActivationDistance = PORTAL_RANGE;
		prompt.HoldDuration = 0.5;
		prompt.Parent = instance;
	}
}

/** Create test portals if none are found. */
function createTestPortals(): void {
	const testPortals = [
		{ mapId: "starter_meadows", connectionId: "to_dark_forest", x: 100, z: 0 },
	];

	for (const entry of testPortals) {
		const mapConfig = MapConfigs[entry.mapId];
		if (!mapConfig) continue;
		const connection = mapConfig.connections[entry.connectionId];
		if (!connection) continue;
		const targetMap = MapConfigs[connection.targetMapId];

		const part = new Instance("Part");
		part.Name = `Portal_${targetMap ? targetMap.name : entry.connectionId}`;
		part.Anchored = true;
		part.CanCollide = false;
		part.Size = new Vector3(6, 8, 1);
		part.Position = new Vector3(entry.x, 4, entry.z);
		part.Color = Color3.fromRGB(100, 50, 200);
		part.Material = Enum.Material.Neon;
		part.Transparency = 0.3;

		// Portal label
		const billboard = new Instance("BillboardGui");
		billboard.Adornee = part;
		billboard.Size = new UDim2(0, 160, 0, 40);
		billboard.StudsOffset = new Vector3(0, 6, 0);
		billboard.AlwaysOnTop = true;
		billboard.Parent = part;

		const nameLabel = new Instance("TextLabel");
		nameLabel.Size = UDim2.fromScale(1, 0.6);
		nameLabel.BackgroundTransparency = 1;
		nameLabel.Text = targetMap ? `To ${targetMap.name}` : "Portal";
		nameLabel.TextColor3 = Color3.fromRGB(200, 150, 255);
		nameLabel.TextScaled = true;
		nameLabel.Font = Enum.Font.GothamBold;
		nameLabel.TextStrokeTransparency = 0.5;
		nameLabel.TextStrokeColor3 = Color3.fromRGB(0, 0, 0);
		nameLabel.Parent = billboard;

		const levelLabel = new Instance("TextLabel");
		levelLabel.Size = UDim2.fromScale(1, 0.4);
		levelLabel.Position = UDim2.fromScale(0, 0.6);
		levelLabel.BackgroundTransparency = 1;
		levelLabel.Text = targetMap ? `Recommended Lv. ${targetMap.recommendedLevel}` : "";
		levelLabel.TextColor3 = Color3.fromRGB(180, 180, 180);
		levelLabel.TextScaled = true;
		levelLabel.Font = Enum.Font.Gotham;
		levelLabel.TextStrokeTransparency = 0.7;
		levelLabel.Parent = billboard;

		CollectionService.AddTag(part, PORTAL_TAG);
		part.SetAttribute("MapId", entry.mapId);
		part.SetAttribute("ConnectionId", entry.connectionId);
		part.Parent = Workspace;
	}
}

// --- Initialize ---

export function initialize(): void {
	// Scan for tagged portals
	const taggedPortals = CollectionService.GetTagged(PORTAL_TAG);
	for (const instance of taggedPortals) {
		const mapId = instance.GetAttribute("MapId") as string | undefined;
		const connectionId = instance.GetAttribute("ConnectionId") as string | undefined;
		if (mapId && connectionId && instance.IsA("BasePart")) {
			registerPortal(instance, mapId, connectionId);
		}
	}

	// Listen for portals added at runtime
	CollectionService.GetInstanceAddedSignal(PORTAL_TAG).Connect((instance) => {
		const mapId = instance.GetAttribute("MapId") as string | undefined;
		const connectionId = instance.GetAttribute("ConnectionId") as string | undefined;
		if (mapId && connectionId && instance.IsA("BasePart")) {
			registerPortal(instance, mapId, connectionId);
		}
	});

	// If no portals found, create test ones
	if (portals.size() === 0) {
		print("[TeleportService] No portals found — creating test portals");
		createTestPortals();
	}

	// Wire proximity prompts for all portals
	for (const [, portal] of portals) {
		const prompt = portal.instance.FindFirstChildWhichIsA("ProximityPrompt");
		if (prompt) {
			prompt.Triggered.Connect((player) => {
				requestTeleport(player, portal.portalId);
			});
		}
	}

	// Handle spawn point on arrival (from TeleportService join data)
	Players.PlayerAdded.Connect((player) => {
		task.spawn(() => {
			const [success, joinData] = pcall(() => {
				return player.GetJoinData();
			});

			if (success && joinData !== undefined) {
				const teleportData = joinData.TeleportData as { spawnPoint?: string } | undefined;
				if (teleportData?.spawnPoint) {
					const spawnPart = Workspace.FindFirstChild(teleportData.spawnPoint) as BasePart | undefined;
					if (spawnPart) {
						player.CharacterAdded.Connect((character) => {
							task.wait(0.1);
							const rootPart = character.FindFirstChild("HumanoidRootPart") as Part | undefined;
							if (rootPart) {
								rootPart.CFrame = new CFrame(spawnPart.Position.add(new Vector3(0, 3, 0)));
							}
						});
					}
				}
			}
		});
	});

	print("[TeleportService] Initialized");
}
