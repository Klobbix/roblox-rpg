import { ItemConfig } from "../types";
import { ExpansionScrollConfigs } from "./expansion-scrolls";
import { PotionConfigs } from "./potions";

export const ConsumableConfigs: Record<string, ItemConfig> = {
	...ExpansionScrollConfigs,
	...PotionConfigs,
}