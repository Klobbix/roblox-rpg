/** A connection from one map to another */
export interface MapConnection {
	/** The target map to teleport to */
	targetMapId: string;
	/** Spawn point name in the target map */
	spawnPoint: string;
}

/** Definition for a single map (Place) */
export interface MapConfig {
	id: string;
	name: string;
	/** Roblox Place ID — 0 means current place (for development) */
	placeId: number;
	/** Suggested combat level for this map */
	recommendedLevel: number;
	/** Connections to other maps */
	connections: Record<string, MapConnection>;
}

export const MapConfigs: Record<string, MapConfig> = {
	starter_meadows: {
		id: "starter_meadows",
		name: "Starter Meadows",
		placeId: 0,
		recommendedLevel: 1,
		connections: {
			to_dark_forest: {
				targetMapId: "dark_forest",
				spawnPoint: "from_meadows",
			},
		},
	},
	dark_forest: {
		id: "dark_forest",
		name: "Dark Forest",
		placeId: 0,
		recommendedLevel: 5,
		connections: {
			to_starter_meadows: {
				targetMapId: "starter_meadows",
				spawnPoint: "from_forest",
			},
			to_mountain_pass: {
				targetMapId: "mountain_pass",
				spawnPoint: "from_forest",
			},
		},
	},
	mountain_pass: {
		id: "mountain_pass",
		name: "Mountain Pass",
		placeId: 0,
		recommendedLevel: 10,
		connections: {
			to_dark_forest: {
				targetMapId: "dark_forest",
				spawnPoint: "from_mountain",
			},
		},
	},
};

/** The default map players start on */
export const DEFAULT_MAP_ID = "starter_meadows";
