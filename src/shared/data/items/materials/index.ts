import { ItemConfig } from "../types";
import { LogConfigs } from "./logs";
import { OreConfigs } from "./ores";
import { RawFishConfigs } from "./raw_fish";
import { CollectibleConfigs } from "./collectibles";
import { CraftingConfigs } from "./crafting";
import { JunkConfigs } from "./junk";
import { RawMeatConfigs } from "./raw_meats";

export const MaterialConfigs: Record<string, ItemConfig> = {
	...CollectibleConfigs,
	...CraftingConfigs,
	...JunkConfigs,
	...LogConfigs,
	...OreConfigs,
	...RawFishConfigs,
	...RawMeatConfigs,
};
