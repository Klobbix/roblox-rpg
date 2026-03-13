import { GeneralStoreOwnerConfigs } from "./general-store-owners";
import { WeaponSmithConfigs } from "./weapon-smiths";
import { InstructorConfigs } from "./instructors";
import { GuideConfigs } from "./guides";
import { DialogueConfig } from "shared/data/dialogues";

export type { DialogueConfig, DialogueNode, DialogueOption, DialogueAction } from "shared/data/dialogues";
export type NPCType = "merchant" | "questGiver" | "dialogue";

export interface NPCConfig {
	id: string;
	name: string;
	npcType: NPCType;
	/** Inline dialogue tree shown when interacted with */
	dialogue?: DialogueConfig;
	/** Shop to open (merchant NPCs) */
	shopId?: string;
}

export const NPCConfigs: Record<string, NPCConfig> = {
	...GeneralStoreOwnerConfigs,
	...WeaponSmithConfigs,
	...InstructorConfigs,
	...GuideConfigs,
};
