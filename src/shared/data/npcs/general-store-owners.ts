import { NPCConfig } from "./index";

export const GeneralStoreOwnerConfigs: Record<string, NPCConfig> = {
	general_store_owner: {
		id: "general_store_owner",
		name: "Shopkeeper",
		npcType: "merchant",
		shopId: "general_store",
		dialogue: {
			startNodeId: "start",
			nodes: {
				start: {
					text: "Welcome to my shop! I buy and sell all sorts of goods. What can I do for you?",
					options: [
						{ label: "Show me your wares.", action: { type: "openShop", shopId: "general_store" } },
						{ label: "Just browsing, thanks.", action: { type: "closeDialogue" } },
					],
				},
			},
		},
	},
};
