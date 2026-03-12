/** NPC type determines available interactions */
export type NPCType = "merchant" | "questGiver" | "dialogue";

/** Definition for a single NPC */
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
	general_store_owner: {
		id: "general_store_owner",
		name: "Shopkeeper",
		npcType: "merchant",
		dialogueId: "general_store_greeting",
		shopId: "general_store",
	},
	weapon_smith: {
		id: "weapon_smith",
		name: "Weapon Smith",
		npcType: "merchant",
		dialogueId: "weapon_smith_greeting",
		shopId: "weapon_shop",
	},
	mining_instructor: {
		id: "mining_instructor",
		name: "Mining Instructor",
		npcType: "dialogue",
		dialogueId: "mining_instructor_dialogue",
	},
	town_guide: {
		id: "town_guide",
		name: "Town Guide",
		npcType: "dialogue",
		dialogueId: "town_guide_dialogue",
	},
};
