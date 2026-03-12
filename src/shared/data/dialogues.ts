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

/** A complete dialogue tree */
export interface DialogueConfig {
	id: string;
	startNodeId: string;
	nodes: Record<string, DialogueNode>;
}

export const DialogueConfigs: Record<string, DialogueConfig> = {
	general_store_greeting: {
		id: "general_store_greeting",
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
	weapon_smith_greeting: {
		id: "weapon_smith_greeting",
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
	mining_instructor_dialogue: {
		id: "mining_instructor_dialogue",
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
	town_guide_dialogue: {
		id: "town_guide_dialogue",
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
};
