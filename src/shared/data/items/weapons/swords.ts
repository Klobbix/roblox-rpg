import { ItemConfig, ItemRarity, ItemType } from "../types";
import { EquipmentSlot } from "../../../types";
import { SwingStyle } from "../types";

export const SwordConfigs: Record<string, ItemConfig> = {
	bronze_sword: {
		id: "bronze_sword",
		name: "Bronze Sword",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Common,
		description: "A short bronze sword.",
		stackable: false,
		maxStack: 1,
		sellPrice: 10,
		equipment: {
			equipSlot: EquipmentSlot.Weapon,
			statBonuses: { attack: 2, strength: 1 },
			levelRequirement: 1,
			attackSpeed: 2.0,
		},
		viewmodel: {
			holdOffset: new CFrame(0.5, -0.6, -1.1).mul(CFrame.Angles(0, 0, math.rad(-10))),
			swingStyle: SwingStyle.Slash,
			swingDuration: 0.32,
		},
	},
	iron_sword: {
		id: "iron_sword",
		name: "Iron Sword",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Uncommon,
		description: "A sturdy iron sword.",
		stackable: false,
		maxStack: 1,
		sellPrice: 50,
		equipment: {
			equipSlot: EquipmentSlot.Weapon,
			statBonuses: { attack: 5, strength: 4 },
			levelRequirement: 5,
			attackSpeed: 2.4,
		},
		viewmodel: {
			holdOffset: new CFrame(0.5, -0.62, -1.15).mul(CFrame.Angles(0, 0, math.rad(-12))),
			swingStyle: SwingStyle.Slash,
			swingDuration: 0.35,
		},
	},
};
