/** Maximum skill level */
export const MAX_SKILL_LEVEL = 99;

/** Skill definition */
export interface SkillConfig {
	id: string;
	name: string;
	/** Item IDs of tools usable with this skill */
	tools: string[];
}

/** EXP needed to advance from (level-1) to level for skills. */
export function skillExpBetweenLevels(level: number): number {
	if (level <= 1) return 0;
	const base = level - 1;
	return math.floor(80 * base * math.sqrt(base));
}

/** Total cumulative skill EXP required to reach a given level. */
export function totalSkillExpForLevel(level: number): number {
	if (level <= 1) return 0;
	let total = 0;
	for (let i = 2; i <= level; i++) {
		total += skillExpBetweenLevels(i);
	}
	return total;
}

/** Determine skill level from total cumulative EXP. */
export function skillLevelFromTotalExp(totalExp: number): number {
	let level = 1;
	let accumulated = 0;
	while (level < MAX_SKILL_LEVEL) {
		const needed = skillExpBetweenLevels(level + 1);
		if (accumulated + needed > totalExp) break;
		accumulated += needed;
		level++;
	}
	return level;
}

export const SkillConfigs: Record<string, SkillConfig> = {
	mining: {
		id: "mining",
		name: "Mining",
		tools: ["bronze_pickaxe", "iron_pickaxe", "steel_pickaxe"],
	},
	woodcutting: {
		id: "woodcutting",
		name: "Woodcutting",
		tools: ["bronze_hatchet", "iron_hatchet", "steel_hatchet"],
	},
	fishing: {
		id: "fishing",
		name: "Fishing",
		tools: ["fishing_rod", "steel_fishing_rod"],
	},
};

/** All skill IDs for iteration */
export const SKILL_IDS: readonly string[] = ["mining", "woodcutting", "fishing"];
