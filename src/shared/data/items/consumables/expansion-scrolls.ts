import { ItemConfig, ItemType, ItemRarity } from "../types";

export const ExpansionScrollConfigs: Record<string, ItemConfig> = {
	slot_expansion_scroll: {
		id: "slot_expansion_scroll",
		name: "Slot Expansion Scroll",
		itemType: ItemType.Consumable,
		rarity: ItemRarity.Rare,
		description: "Use on an inventory tab to add 8 extra slots. Can expand up to 96 slots per tab.",
		stackable: true,
		maxStack: 10,
		sellPrice: 500,
	},
};
