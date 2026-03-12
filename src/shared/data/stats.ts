import { CombatStats } from "shared/types/player";

/** Maximum combat level */
export const MAX_COMBAT_LEVEL = 99;

/** EXP needed to advance from (level-1) to level. */
export function expBetweenLevels(level: number): number {
	if (level <= 1) return 0;
	// x^1.5 = x * sqrt(x)
	const base = level - 1;
	return math.floor(100 * base * math.sqrt(base));
}

/** Total cumulative EXP required to reach a given level. */
export function totalExpForLevel(level: number): number {
	if (level <= 1) return 0;
	let total = 0;
	for (let i = 2; i <= level; i++) {
		total += expBetweenLevels(i);
	}
	return total;
}

/** Determine combat level from total cumulative EXP. */
export function levelFromTotalExp(totalExp: number): number {
	let level = 1;
	let accumulated = 0;
	while (level < MAX_COMBAT_LEVEL) {
		const needed = expBetweenLevels(level + 1);
		if (accumulated + needed > totalExp) break;
		accumulated += needed;
		level++;
	}
	return level;
}

/** Base combat stats for a given level (no equipment bonuses). */
export function baseStatsForLevel(level: number): CombatStats {
	return {
		maxHp: 10 + level * 3,
		attack: 1 + math.floor(level * 1.2),
		strength: 1 + math.floor(level * 1.1),
		defense: 1 + math.floor(level * 1.0),
	};
}

/**
 * Roll damage from attacker to defender.
 * Returns 0 on miss, otherwise a random value in [1, maxHit].
 */
export function rollDamage(attacker: CombatStats, defender: CombatStats): number {
	const effectiveAttack = attacker.attack + attacker.strength;
	const effectiveDefense = defender.defense;

	// Accuracy: higher attack vs defense = more likely to hit
	const accuracy = effectiveAttack / (effectiveAttack + effectiveDefense);
	if (math.random() > accuracy) return 0;

	const maxHit = math.max(1, math.floor(attacker.strength * 0.5 + 1));
	return math.random(1, maxHit);
}

/** EXP reward for killing a mob of a given level. */
export function mobExpReward(mobLevel: number): number {
	return mobLevel * 10 + 5;
}
