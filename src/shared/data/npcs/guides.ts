import { NPCConfig } from "./index";

export const GuideConfigs: Record<string, NPCConfig> = {
	town_guide: {
		id: "town_guide",
		name: "Town Guide",
		npcType: "dialogue",
		dialogue: {
			startNodeId: "start",
			nodes: {
				start: {
					text: "Welcome to town, traveler! There's plenty to do around here. What would you like to know?",
					options: [
						{ label: "Where can I buy supplies?", nextNodeId: "shops" },
						{ label: "Where can I train combat?", nextNodeId: "combat" },
						{ label: "Where can I gather resources?", nextNodeId: "gathering" },
						{ label: "I'm good, thanks.", action: { type: "closeDialogue" } },
					],
				},
				shops: {
					text: "The Shopkeeper runs a general store to the east. For weapons and armor, visit the Weapon Smith to the north. They buy items too!",
					options: [
						{ label: "Tell me about combat.", nextNodeId: "combat" },
						{ label: "Thanks!", action: { type: "closeDialogue" } },
					],
				},
				combat: {
					text: "Chickens roam south of town — good for beginners. Goblins lurk further out for a tougher fight. Skeletons haunt the far reaches for the brave!",
					options: [
						{ label: "Where can I gather resources?", nextNodeId: "gathering" },
						{ label: "Thanks!", action: { type: "closeDialogue" } },
					],
				},
				gathering: {
					text: "Mining rocks are to the west, trees are northwest, and a fishing spot lies to the southwest. You'll need the right tools — the Shopkeeper sells basic ones.",
					options: [
						{ label: "Where can I buy supplies?", nextNodeId: "shops" },
						{ label: "Thanks!", action: { type: "closeDialogue" } },
					],
				},
			},
		},
	},
};
