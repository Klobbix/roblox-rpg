/** A single entry in an inline loot table */
export interface LootEntry {
	itemId: string;
	/** 0–100 percent chance to drop per roll */
	weight: number;
	minQty: number;
	maxQty: number;
}

/** Inline loot table embedded directly in a mob or node config */
export interface LootTable {
	/** Number of independent rolls to make */
	rolls: number;
	entries: LootEntry[];
}
