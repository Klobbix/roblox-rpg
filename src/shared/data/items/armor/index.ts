import { ItemConfig } from "../types";
import { PlatebodyConfigs } from "./platebodies";
import { HelmetConfigs } from "./helmets";
import { ShieldConfigs } from "./shields";
import { BootConfigs } from "./boots";
import { GloveConfigs } from "./gloves";
import { PantConfigs } from "./pants";
import { RingConfigs } from "./rings";
import { AmuletConfigs } from "./amulets";
import { CapeConfigs } from "./capes";

export const ArmorConfigs: Record<string, ItemConfig> = {
	...HelmetConfigs,
	...AmuletConfigs,
	...PlatebodyConfigs,
	...CapeConfigs,
	...GloveConfigs,
	...ShieldConfigs,
	...RingConfigs,
	...PantConfigs,
	...BootConfigs,
};
