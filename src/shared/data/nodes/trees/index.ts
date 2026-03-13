import { GatheringNodeConfig } from "../index";
import { NormalTreeConfigs } from "./normal-tree";
import { OakTreeConfigs } from "./oak";

export const TreesConfigs: Record<string, GatheringNodeConfig> = {
	...NormalTreeConfigs,
	...OakTreeConfigs,
};
