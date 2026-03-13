import { GatheringNodeConfig } from "../index";
import { CopperConfigs } from "./copper";
import { IronConfigs } from "./iron";
import { TinConfigs } from "./tin";

export const OreNodesConfigs: Record<string, GatheringNodeConfig> = {
	...CopperConfigs,
	...IronConfigs,
	...TinConfigs,
};
