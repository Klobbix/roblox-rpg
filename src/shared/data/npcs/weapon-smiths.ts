import { NPCConfig } from "./index";

export const WeaponSmithConfigs: Record<string, NPCConfig> = {
	weapon_smith: {
		id: "weapon_smith",
		name: "Weapon Smith",
		npcType: "merchant",
		dialogueId: "weapon_smith_greeting",
		shopId: "weapon_shop",
	},
};