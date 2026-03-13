import { GeneralStoreOwnerConfigs } from "./general-store-owners";
import { WeaponSmithConfigs } from "./weapon-smiths";
import { InstructorConfigs } from "./instructors";
import { GuideConfigs } from "./guides";

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

/** Actions that can be triggered by dialogue options */
export interface DialogueAction {
	type: "openShop" | "giveItem" | "closeDialogue";
	shopId?: string;
	itemId?: string;
	quantity?: number;
}

/** A single option the player can choose */
export interface DialogueOption {
	label: string;
	/** ID of the next dialogue node. If undefined, dialogue closes. */
	nextNodeId?: string;
	/** Action to perform when this option is selected */
	action?: DialogueAction;
}

/** A single node in a dialogue tree */
export interface DialogueNode {
	text: string;
	options: DialogueOption[];
}

/** Inline dialogue tree embedded directly in an NPC config */
export interface DialogueConfig {
	startNodeId: string;
	nodes: Record<string, DialogueNode>;
}

export const NPCConfigs: Record<string, NPCConfig> = {
	...GeneralStoreOwnerConfigs,
	...WeaponSmithConfigs,
	...InstructorConfigs,
	...GuideConfigs,
};
