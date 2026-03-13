import { NPCConfig } from "./index";

export const InstructorConfigs: Record<string, NPCConfig> = {
	mining_instructor: {
		id: "mining_instructor",
		name: "Mining Instructor",
		npcType: "dialogue",
		dialogue: {
			startNodeId: "start",
			nodes: {
				start: {
					text: "Ahoy! Want to learn about mining? It's a fine skill for making gold!",
					options: [
						{ label: "How do I start mining?", nextNodeId: "how_to_mine" },
						{ label: "What tools do I need?", nextNodeId: "tools" },
						{ label: "No thanks.", action: { type: "closeDialogue" } },
					],
				},
				how_to_mine: {
					text: "Find a rock formation and click on it. You'll need a pickaxe in your inventory. The higher your Mining level, the more ores you can mine!",
					options: [
						{ label: "What tools do I need?", nextNodeId: "tools" },
						{ label: "Here, take this.", action: { type: "giveItem", itemId: "bronze_pickaxe", quantity: 1 } },
						{ label: "Thanks!", action: { type: "closeDialogue" } },
					],
				},
				tools: {
					text: "You'll want a pickaxe! Bronze is good to start with. As you level up, upgrade to iron and then steel for faster mining.",
					options: [
						{ label: "How do I start mining?", nextNodeId: "how_to_mine" },
						{ label: "Got it, thanks!", action: { type: "closeDialogue" } },
					],
				},
			},
		},
	},
};
