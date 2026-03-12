import { ItemConfig, ItemRarity, ItemType } from "../types";

export const CollectibleConfigs: Record<string, ItemConfig> = {
	skull: {
		id: "skull",
		name: "Skull",
		itemType: ItemType.Quest,
		rarity: ItemRarity.Uncommon,
		description: "A grim skull. Some collectors may want this.",
		stackable: true,
		maxStack: 99,
		sellPrice: 10,
	},
};