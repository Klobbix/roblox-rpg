import { GatheringNodeConfig } from "../index";
import { ShrimpNodeConfigs } from "./shrimp";

export const FishingNodeConfigs: Record<string, GatheringNodeConfig> = {
	...ShrimpNodeConfigs,
};
