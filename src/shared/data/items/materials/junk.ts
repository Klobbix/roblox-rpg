import { ItemConfig, ItemRarity, ItemType } from "../types";

export const JunkConfigs: Record<string, ItemConfig> = {
	rubbish: {
		id: "rubbish",
		name: "Rubbish",
		itemType: ItemType.Material,
		rarity: ItemRarity.Common,
		description: "A jumble of rubbish.",
		stackable: true,
		maxStack: 99,
		sellPrice: 1,
	},
	bones: {
		id: "bones",
		name: "Bones",
		itemType: ItemType.Material,
		rarity: ItemRarity.Common,
		description: "A pile of bones.",
		stackable: true,
		maxStack: 99,
		sellPrice: 3,
	}
};