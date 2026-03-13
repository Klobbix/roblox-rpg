import { GeneralStoreOwnerConfigs } from "./general-store-owners";
import { WeaponSmithConfigs } from "./weapon-smiths";
import { InstructorConfigs } from "./instructors";
import { GuideConfigs } from "./guides";

export type NPCType = "merchant" | "questGiver" | "dialogue";

export interface NPCConfig {
	id: string;
	name: string;
	npcType: NPCType;
	/** Dialogue tree to show when interacted with */
	dialogueId?: string;
	/** Shop to open (merchant NPCs) */
	shopId?: string;
}

export const NPCConfigs: Record<string, NPCConfig> = {
	...GeneralStoreOwnerConfigs,
	...WeaponSmithConfigs,
	...InstructorConfigs,
	...GuideConfigs,
};
