import { SkillProgress } from "shared/types/player";
import { SkillConfigs, skillLevelFromTotalExp } from "shared/data/skills";
import { ItemConfigs } from "shared/data/items";
import { fireClient } from "server/network/server-network";
import * as PlayerDataService from "./player-data-service";

// --- Public API ---

/** Get a player's skill progress, initializing if needed. */
export function getSkillProgress(player: Player, skillId: string): SkillProgress {
	const profile = PlayerDataService.getProfile(player);
	if (!profile) return { level: 1, exp: 0 };

	if (!profile.skills[skillId]) {
		profile.skills[skillId] = { level: 1, exp: 0 };
	}

	return profile.skills[skillId];
}

/** Grant skill EXP and handle level-ups. */
export function grantSkillExp(
	player: Player,
	skillId: string,
	amount: number,
): { leveledUp: boolean; newLevel: number } {
	const profile = PlayerDataService.getProfile(player);
	if (!profile) return { leveledUp: false, newLevel: 0 };

	if (!profile.skills[skillId]) {
		profile.skills[skillId] = { level: 1, exp: 0 };
	}

	const skill = profile.skills[skillId];
	const oldLevel = skill.level;
	skill.exp += amount;
	const newLevel = skillLevelFromTotalExp(skill.exp);

	fireClient(player, "SkillExpGained", {
		skillId,
		amount,
		totalExp: skill.exp,
		level: newLevel,
	});

	if (newLevel > oldLevel) {
		skill.level = newLevel;

		const config = SkillConfigs[skillId];
		const skillName = config ? config.name : skillId;
		print(`[SkillService] ${player.Name} leveled up ${skillName} to ${newLevel}`);

		fireClient(player, "SkillLevelUp", { skillId, newLevel });

		return { leveledUp: true, newLevel };
	}

	return { leveledUp: false, newLevel: oldLevel };
}

/**
 * Find the best tool a player has for a given skill.
 * Checks equipped items first, then Equip inventory tab.
 * Returns the tool's speed multiplier, or undefined if no tool found.
 */
export function findBestTool(
	player: Player,
	skillId: string,
): { itemId: string; speedMultiplier: number } | undefined {
	const profile = PlayerDataService.getProfile(player);
	if (!profile) return undefined;

	let bestTool: { itemId: string; speedMultiplier: number } | undefined;

	// Check equipment slots
	for (const [, equipped] of pairs(profile.equipment)) {
		const config = ItemConfigs[equipped.itemId];
		if (config?.tool && config.tool.skillId === skillId) {
			if (profile.skills[skillId]?.level ?? 1 >= config.tool.levelRequirement) {
				if (!bestTool || config.tool.speedMultiplier < bestTool.speedMultiplier) {
					bestTool = { itemId: equipped.itemId, speedMultiplier: config.tool.speedMultiplier };
				}
			}
		}
	}

	// Check Equip inventory tab
	const equipTab = profile.inventory.Equip;
	for (let i = 0; i < equipTab.slotCount; i++) {
		const slot = equipTab.slots[i];
		if (slot === undefined) continue;
		const config = ItemConfigs[slot.itemId];
		if (config?.tool && config.tool.skillId === skillId) {
			const skillLevel = profile.skills[skillId]?.level ?? 1;
			if (skillLevel >= config.tool.levelRequirement) {
				if (!bestTool || config.tool.speedMultiplier < bestTool.speedMultiplier) {
					bestTool = { itemId: slot.itemId, speedMultiplier: config.tool.speedMultiplier };
				}
			}
		}
	}

	return bestTool;
}

// --- Initialize ---

export function initialize(): void {
	print("[SkillService] Initialized");
}
