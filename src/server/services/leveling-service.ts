import { levelFromTotalExp, baseStatsForLevel } from "shared/data/stats";
import { fireClient } from "server/network/server-network";
import * as PlayerDataService from "./player-data-service";

/**
 * Grant combat EXP to a player. Handles level-up detection and notifications.
 * Returns whether the player leveled up and their new level.
 */
export function grantCombatExp(
	player: Player,
	amount: number,
): { leveledUp: boolean; newLevel: number } {
	const profile = PlayerDataService.getProfile(player);
	if (!profile) return { leveledUp: false, newLevel: 0 };

	const oldLevel = profile.combatLevel;
	profile.combatExp += amount;
	const newLevel = levelFromTotalExp(profile.combatExp);

	fireClient(player, "ExpGained", {
		amount,
		totalExp: profile.combatExp,
		level: newLevel,
	});

	if (newLevel > oldLevel) {
		profile.combatLevel = newLevel;
		const newStats = baseStatsForLevel(newLevel);

		fireClient(player, "LevelUp", {
			newLevel,
			stats: newStats,
		});

		return { leveledUp: true, newLevel };
	}

	return { leveledUp: false, newLevel: oldLevel };
}

export function initialize(): void {
	print("[LevelingService] Initialized");
}
