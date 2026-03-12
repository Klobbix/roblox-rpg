import { ItemConfig, ItemRarity, ItemType } from "../types";

export const CraftingConfigs: Record<string, ItemConfig> = {
	feather: {
		id: "feather",
		name: "Feather",
		itemType: ItemType.Material,
		rarity: ItemRarity.Common,
		description: "A soft feather. Used in crafting.",
		stackable: true,
		maxStack: 99,
		sellPrice: 1,
	},
};