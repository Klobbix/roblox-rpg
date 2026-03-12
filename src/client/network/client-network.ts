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

const clientEventCache = new Map<string, RemoteEvent>();
const serverEventCache = new Map<string, RemoteEvent>();

let toClientFolder: Folder;
let toServerFolder: Folder;

/** Wait for server-created remotes and cache them locally. */
export function initialize(): void {
	const remotesFolder = ReplicatedStorage.WaitForChild(REMOTES_FOLDER) as Folder;
	toClientFolder = remotesFolder.WaitForChild(TO_CLIENT_FOLDER) as Folder;
	toServerFolder = remotesFolder.WaitForChild(TO_SERVER_FOLDER) as Folder;

	for (const name of CLIENT_EVENT_NAMES) {
		const remote = toClientFolder.WaitForChild(name) as RemoteEvent;
		clientEventCache.set(name, remote);
	}

	for (const name of SERVER_EVENT_NAMES) {
		const remote = toServerFolder.WaitForChild(name) as RemoteEvent;
		serverEventCache.set(name, remote);
	}

	print("[ClientNetwork] Initialized");
}

/** Fire an event to the server. */
export function fireServer<K extends keyof ServerEventDefinitions>(
	event: K,
	data: ServerEventDefinitions[K],
): void {
	const remote = serverEventCache.get(event as string);
	if (!remote) {
		warn(`[ClientNetwork] No remote found for server event: ${event as string}`);
		return;
	}
	remote.FireServer(data);
}

/** Listen for a server-to-client event. */
export function onClientEvent<K extends keyof ClientEventDefinitions>(
	event: K,
	callback: (data: ClientEventDefinitions[K]) => void,
): RBXScriptConnection {
	const remote = clientEventCache.get(event as string);
	if (!remote) {
		warn(`[ClientNetwork] No remote found for client event: ${event as string}`);
		// Return a dummy connection to avoid nil errors
		return { Connected: false, Disconnect: () => {} } as unknown as RBXScriptConnection;
	}

	return remote.OnClientEvent.Connect((...args: unknown[]) => {
		callback(args[0] as ClientEventDefinitions[K]);
	});
}
