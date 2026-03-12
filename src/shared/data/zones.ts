/** Zone type affects UI display and gameplay associations */
export type ZoneType = "combat" | "town" | "gathering";

/** Definition for a zone within a map */
export interface ZoneConfig {
	id: string;
	name: string;
	zoneType: ZoneType;
	/** Which map this zone belongs to */
	mapId: string;
}

export const ZoneConfigs: Record<string, ZoneConfig> = {
	lumbridge_town: {
		id: "lumbridge_town",
		name: "Lumbridge",
		zoneType: "town",
		mapId: "starter_meadows",
	},
	chicken_field: {
		id: "chicken_field",
		name: "Chicken Field",
		zoneType: "combat",
		mapId: "starter_meadows",
	},
	goblin_camp: {
		id: "goblin_camp",
		name: "Goblin Camp",
		zoneType: "combat",
		mapId: "starter_meadows",
	},
	mining_quarry: {
		id: "mining_quarry",
		name: "Mining Quarry",
		zoneType: "gathering",
		mapId: "starter_meadows",
	},
	forest_clearing: {
		id: "forest_clearing",
		name: "Forest Clearing",
		zoneType: "gathering",
		mapId: "starter_meadows",
	},
	skeleton_graveyard: {
		id: "skeleton_graveyard",
		name: "Skeleton Graveyard",
		zoneType: "combat",
		mapId: "starter_meadows",
	},
};

/** Default zone when player is not inside any zone volume */
export const DEFAULT_ZONE_NAME = "Wilderness";
