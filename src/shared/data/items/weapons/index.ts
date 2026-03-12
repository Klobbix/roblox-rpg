import { ItemConfig } from "../types";
import { DaggerConfigs } from "./daggers";
import { SwordConfigs } from "./swords";

export const WeaponConfigs: Record<string, ItemConfig> = {
	...DaggerConfigs,
	...SwordConfigs,
};
