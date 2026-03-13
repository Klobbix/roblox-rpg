import { NPCConfig } from "./index";

export const GeneralStoreOwnerConfigs: Record<string, NPCConfig> = {
	general_store_owner: {
		id: "general_store_owner",
		name: "Shopkeeper",
		npcType: "merchant",
		dialogueId: "general_store_greeting",
		shopId: "general_store",
	},
};