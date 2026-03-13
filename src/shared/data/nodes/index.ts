import { OreNodesConfigs } from "./ores";
import { TreesConfigs } from "./trees";
import { FishingNodeConfigs } from "./fishing";
import { LootTable } from "shared/data/loot-tables";

export type { LootTable } from "shared/data/loot-tables";
export type { LootEntry } from "shared/data/loot-tables";

/** Data config for a gathering node type */
export interface GatheringNodeConfig {
	id: string;
	name: string;
	skillId: string;
	levelRequired: number;
	expReward: number;
	loot: LootTable;
	respawnTime: number;
	/** Tool required for this node (any tool for this skill works) */
	toolRequired: boolean;
	/** Number of swings needed to deplete this node with a tier-1 tool */
	hitsRequired: number;
}

export const GatheringNodeConfigs: Record<string, GatheringNodeConfig> = {
	...OreNodesConfigs,
	...FishingNodeConfigs,
	...TreesConfigs,
};
