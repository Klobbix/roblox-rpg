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
