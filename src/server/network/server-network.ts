import { ReplicatedStorage } from "@rbxts/services";
import {
	ClientEventDefinitions,
	ServerEventDefinitions,
	CLIENT_EVENT_NAMES,
	SERVER_EVENT_NAMES,
	REMOTES_FOLDER,
	TO_CLIENT_FOLDER,
	TO_SERVER_FOLDER,
} from "shared/network/remotes";

const clientEvents = new Map<string, RemoteEvent>();
const serverEvents = new Map<string, RemoteEvent>();
const rateLimits = new Map<string, number>();

const DEFAULT_RATE_LIMIT = 0.1; // 100ms minimum between calls per player per event

let remotesFolder: Folder;
let toClientFolder: Folder;
let toServerFolder: Folder;

/** Create all remote instances eagerly so clients can WaitForChild safely. */
export function initialize(): void {
	remotesFolder = new Instance("Folder");
	remotesFolder.Name = REMOTES_FOLDER;
	remotesFolder.Parent = ReplicatedStorage;

	toClientFolder = new Instance("Folder");
	toClientFolder.Name = TO_CLIENT_FOLDER;
	toClientFolder.Parent = remotesFolder;

	toServerFolder = new Instance("Folder");
	toServerFolder.Name = TO_SERVER_FOLDER;
	toServerFolder.Parent = remotesFolder;

	for (const name of CLIENT_EVENT_NAMES) {
		const remote = new Instance("RemoteEvent");
		remote.Name = name;
		remote.Parent = toClientFolder;
		clientEvents.set(name, remote);
	}

	for (const name of SERVER_EVENT_NAMES) {
		const remote = new Instance("RemoteEvent");
		remote.Name = name;
		remote.Parent = toServerFolder;
		serverEvents.set(name, remote);
	}
}

/** Fire an event to a single client. */
export function fireClient<K extends keyof ClientEventDefinitions>(
	player: Player,
	event: K,
	data: ClientEventDefinitions[K],
): void {
	const remote = clientEvents.get(event as string);
	if (!remote) {
		warn(`[ServerNetwork] No remote found for client event: ${event as string}`);
		return;
	}
	remote.FireClient(player, data);
}

/** Fire an event to all connected clients. */
export function fireAllClients<K extends keyof ClientEventDefinitions>(
	event: K,
	data: ClientEventDefinitions[K],
): void {
	const remote = clientEvents.get(event as string);
	if (!remote) {
		warn(`[ServerNetwork] No remote found for client event: ${event as string}`);
		return;
	}
	remote.FireAllClients(data);
}

/** Listen for a client-to-server event with automatic rate limiting. */
export function onServerEvent<K extends keyof ServerEventDefinitions>(
	event: K,
	callback: (player: Player, data: ServerEventDefinitions[K]) => void,
	rateLimit = DEFAULT_RATE_LIMIT,
): void {
	const remote = serverEvents.get(event as string);
	if (!remote) {
		warn(`[ServerNetwork] No remote found for server event: ${event as string}`);
		return;
	}

	remote.OnServerEvent.Connect((player: Player, ...args: unknown[]) => {
		// Rate limit per player per event
		const key = `${player.UserId}_${event as string}`;
		const now = os.clock();
		const last = rateLimits.get(key) ?? 0;
		if (now - last < rateLimit) return;
		rateLimits.set(key, now);

		callback(player, args[0] as ServerEventDefinitions[K]);
	});
}

/** Clean up rate limit entries for a disconnected player. */
export function cleanupPlayer(player: Player): void {
	const prefix = `${player.UserId}_`;
	rateLimits.forEach((_, key) => {
		if (key.sub(1, prefix.size()) === prefix) {
			rateLimits.delete(key);
		}
	});
}
