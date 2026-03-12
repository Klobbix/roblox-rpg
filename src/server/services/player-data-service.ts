import { DataStoreService, Players, RunService } from "@rbxts/services";
import { PlayerProfile, DEFAULT_PROFILE } from "shared/types/player";
import { fireClient } from "server/network/server-network";

const DATASTORE_NAME = "PlayerData_v1";
const AUTO_SAVE_INTERVAL = 300; // seconds (5 minutes)

/** Internal wrapper around what gets stored in DataStore */
interface SaveData {
	profile: PlayerProfile;
	sessionLock: string | undefined;
	lastSaved: number;
}

const profiles = new Map<Player, PlayerProfile>();

let store: DataStore;

function getKey(player: Player): string {
	return `player_${player.UserId}`;
}

/** Load a player's profile from DataStore, acquiring a session lock. */
function loadProfile(player: Player): void {
	const key = getKey(player);

	const [success, result] = pcall(() => {
		return store.UpdateAsync(key, (oldValue: unknown) => {
			const saveData = oldValue as SaveData | undefined;

			// Check for session lock conflict
			if (saveData?.sessionLock !== undefined && saveData.sessionLock !== game.JobId) {
				warn(
					`[PlayerData] Session lock conflict for ${player.Name} (locked by ${saveData.sessionLock})`,
				);
			}

			const profile = saveData?.profile ?? { ...DEFAULT_PROFILE };

			const newData: SaveData = {
				profile,
				sessionLock: game.JobId,
				lastSaved: os.time(),
			};
			return $tuple(newData);
		});
	});

	if (!success) {
		warn(`[PlayerData] Failed to load profile for ${player.Name}: ${result}`);
		fireClient(player, "PlayerDataError", "Failed to load your data. Please rejoin.");
		return;
	}

	// Player may have left during the async load
	if (!player.IsDescendantOf(Players)) return;

	const saveData = result as SaveData;
	profiles.set(player, saveData.profile);
	fireClient(player, "PlayerDataLoaded", saveData.profile);
	print(`[PlayerData] Loaded profile for ${player.Name}`);
}

/** Save a player's profile to DataStore, keeping the session lock. */
function saveProfile(player: Player): void {
	const profile = profiles.get(player);
	if (!profile) return;

	const key = getKey(player);
	const saveData: SaveData = {
		profile,
		sessionLock: game.JobId,
		lastSaved: os.time(),
	};

	const [success, err] = pcall(() => {
		store.SetAsync(key, saveData);
	});

	if (!success) {
		warn(`[PlayerData] Failed to save profile for ${player.Name}: ${err}`);
	}
}

/** Save profile and release session lock (used on player leave / shutdown). */
function finalSave(player: Player): void {
	const profile = profiles.get(player);
	if (!profile) return;

	const key = getKey(player);

	pcall(() => {
		store.UpdateAsync(key, () => {
			const newData: SaveData = {
				profile,
				sessionLock: undefined,
				lastSaved: os.time(),
			};
			return $tuple(newData);
		});
	});

	profiles.delete(player);
}

function onPlayerAdded(player: Player): void {
	task.spawn(() => loadProfile(player));
}

function onPlayerRemoving(player: Player): void {
	finalSave(player);
}

/** Start auto-save loop in a coroutine. */
function startAutoSave(): void {
	task.spawn(() => {
		while (true) {
			task.wait(AUTO_SAVE_INTERVAL);
			profiles.forEach((_, player) => {
				if (player.IsDescendantOf(Players)) {
					task.spawn(() => saveProfile(player));
				}
			});
		}
	});
}

/** Initialize the player data system. Call after ServerNetwork.initialize(). */
export function initialize(): void {
	// Use a mock store in Studio to avoid polluting production data
	const storeName = RunService.IsStudio() ? `${DATASTORE_NAME}_DEV` : DATASTORE_NAME;
	store = DataStoreService.GetDataStore(storeName);

	Players.PlayerAdded.Connect(onPlayerAdded);
	Players.PlayerRemoving.Connect(onPlayerRemoving);

	// Handle players who joined before this script ran
	for (const player of Players.GetPlayers()) {
		task.spawn(() => onPlayerAdded(player));
	}

	// Save all profiles on server shutdown
	game.BindToClose(() => {
		profiles.forEach((_, player) => {
			finalSave(player);
		});
	});

	startAutoSave();
	print("[PlayerData] Initialized");
}

/** Get a player's cached profile (undefined if not yet loaded). */
export function getProfile(player: Player): PlayerProfile | undefined {
	return profiles.get(player);
}

/** Update a player's cached profile. Does NOT save to DataStore immediately. */
export function updateProfile(player: Player, updater: (profile: PlayerProfile) => void): boolean {
	const profile = profiles.get(player);
	if (!profile) return false;
	updater(profile);
	return true;
}
