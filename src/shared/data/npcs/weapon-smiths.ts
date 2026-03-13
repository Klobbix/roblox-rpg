import { NPCConfig } from "./index";

export const WeaponSmithConfigs: Record<string, NPCConfig> = {
	weapon_smith: {
		id: "weapon_smith",
		name: "Weapon Smith",
		npcType: "merchant",
		shopId: "weapon_shop",
		dialogue: {
			startNodeId: "start",
			nodes: {
				start: {
					text: "Greetings, adventurer! I forge the finest weapons and armor in the land. Looking to gear up?",
					options: [
						{ label: "Let me see what you have.", action: { type: "openShop", shopId: "weapon_shop" } },
						{ label: "Tell me about your craft.", nextNodeId: "about" },
						{ label: "Not right now.", action: { type: "closeDialogue" } },
					],
				},
				about: {
					text: "I've been smithing for decades. Each weapon I forge is crafted with care. The stronger the metal, the mightier the blade! Come back when you've leveled up and I'll have something special for you.",
					options: [
						{ label: "Show me your weapons.", action: { type: "openShop", shopId: "weapon_shop" } },
						{ label: "Thanks for the info.", action: { type: "closeDialogue" } },
					],
				},
			},
		},
	},
};
