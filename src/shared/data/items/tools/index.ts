import { ItemConfig } from "../types";
import { FishingRodConfigs } from "./fishing-rods";
import { HatchetConfigs } from "./hatchets";
import { PickaxeConfigs } from "./pickaxes";

export const ToolConfigs: Record<string, ItemConfig> = {
	...FishingRodConfigs,
	...HatchetConfigs,
	...PickaxeConfigs,
}