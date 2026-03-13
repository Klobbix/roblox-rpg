import { Players } from "@rbxts/services";
import { CombatStats } from "shared/types/player";
import { baseStatsForLevel, rollDamage, mobExpReward } from "shared/data/stats";
import { getEquipmentBonuses, getWeaponAttackSpeed, ItemConfigs } from "shared/data/items";
import { fireClient } from "server/network/server-network";
import * as PlayerDataService from "./player-data-service";
import * as LevelingService from "./leveling-service";
import * as MobService from "./mob-service";
import * as LootService from "./loot-service";
import * as EquipmentService from "./equipment-service";
import * as HotbarService from "./hotbar-service";

const DEFAULT_ATTACK_SPEED = 2.4; // seconds
const RESPAWN_TIME = 5; // seconds
const SWING_RANGE = 8; // studs

// --- Types ---

interface PlayerCombatState {
	currentHp: number;
	maxHp: number;
	stats: CombatStats;
	lastSwingTime: number;
	attackSpeed: number;
	dead: boolean;
}

// --- State ---

const playerStates = new Map<Player, PlayerCombatState>();

// --- Helpers ---

/** Get stat bonuses from the currently active hotbar item (weapon). */
function getActiveWeaponBonuses(player: Player): CombatStats {
	const bonuses: CombatStats = { maxHp: 0, attack: 0, strength: 0, defense: 0 };
	const activeItemId = HotbarService.getActiveItemId(player);
	if (!activeItemId) return bonuses;

	const config = ItemConfigs[activeItemId];
	if (!config?.equipment) return bonuses;

	const sb = config.equipment.statBonuses;
	bonuses.maxHp = sb.maxHp ?? 0;
	bonuses.attack = sb.attack ?? 0;
	bonuses.strength = sb.strength ?? 0;
	bonuses.defense = sb.defense ?? 0;
	return bonuses;
}

// --- Public API ---

/**
 * Called when the player swings at a mob.
 * Validates range and cooldown, then deals damage.
 */
export function swingAtMob(player: Player, mobId: string): void {
	const state = playerStates.get(player);
	if (!state || state.dead) return;

	const mobState = MobService.getMobState(mobId);
	if (!mobState || mobState.currentHp <= 0) return;

	// Range check
	const rootPart = player.Character?.FindFirstChild("HumanoidRootPart") as Part | undefined;
	if (!rootPart || !mobState.instance.PrimaryPart) return;

	const distance = rootPart.Position.sub(mobState.instance.PrimaryPart.Position).Magnitude;
	if (distance > SWING_RANGE) return;

	// Attack speed cooldown
	const now = os.clock();
	if (now - state.lastSwingTime < state.attackSpeed) return;
	state.lastSwingTime = now;

	// Deal damage
	const damage = rollDamage(state.stats, mobState.config.stats);
	const result = MobService.damageMob(mobId, damage, player);

	// Mob retaliates
	MobService.aggroMob(mobId, player);

	fireClient(player, "DamageDealt", { mobId, damage });

	if (result.died) {
		const exp = mobExpReward(mobState.config.level);
		const levelResult = LevelingService.grantCombatExp(player, exp);
		if (levelResult.leveledUp) {
			recalculateStats(player);
		}
		fireClient(player, "MobDied", { mobId, expReward: exp });

		const mobPos = mobState.instance.PrimaryPart?.Position ?? mobState.spawnPosition;
		LootService.rollAndDropLoot(mobState.configId, mobPos, player);
	}
}

/** Called by MobService (via callback) when a mob hits a player. */
export function damagePlayer(attackerStats: CombatStats, player: Player): void {
	const state = playerStates.get(player);
	if (!state || state.dead) return;

	const damage = rollDamage(attackerStats, state.stats);
	state.currentHp = math.max(0, state.currentHp - damage);

	const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
	if (humanoid) {
		humanoid.Health = state.currentHp;
	}

	fireClient(player, "DamageTaken", {
		damage,
		currentHp: state.currentHp,
		maxHp: state.maxHp,
	});

	if (state.currentHp <= 0) {
		onPlayerDied(player);
	}
}

/** Recalculate a player's combat stats (after level up, equipment change, or hotbar change). */
export function recalculateStats(player: Player): void {
	const state = playerStates.get(player);
	const profile = PlayerDataService.getProfile(player);
	if (!state || !profile) return;

	const baseStats = baseStatsForLevel(profile.combatLevel);
	const equipBonuses = getEquipmentBonuses(profile.equipment);
	const weaponBonuses = getActiveWeaponBonuses(player);
	const activeItemId = HotbarService.getActiveItemId(player);

	const newStats: CombatStats = {
		maxHp: baseStats.maxHp + equipBonuses.maxHp + weaponBonuses.maxHp,
		attack: baseStats.attack + equipBonuses.attack + weaponBonuses.attack,
		strength: baseStats.strength + equipBonuses.strength + weaponBonuses.strength,
		defense: baseStats.defense + equipBonuses.defense + weaponBonuses.defense,
	};

	const hpGain = math.max(0, newStats.maxHp - state.maxHp);
	state.stats = newStats;
	state.maxHp = newStats.maxHp;
	state.currentHp = math.min(state.currentHp + hpGain, state.maxHp);
	state.attackSpeed = getWeaponAttackSpeed(activeItemId, DEFAULT_ATTACK_SPEED);

	const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
	if (humanoid) {
		humanoid.MaxHealth = state.maxHp;
		humanoid.Health = state.currentHp;
	}
}

export function getPlayerState(player: Player): PlayerCombatState | undefined {
	return playerStates.get(player);
}

// --- Internal ---

function onCharacterAdded(player: Player, character: Model): void {
	const existingState = playerStates.get(player);
	const wasRespawn = existingState?.dead === true;

	let profile = PlayerDataService.getProfile(player);
	if (!profile) {
		for (let i = 0; i < 100; i++) {
			task.wait(0.1);
			profile = PlayerDataService.getProfile(player);
			if (profile) break;
		}
		if (!profile) return;
	}

	const baseStats = baseStatsForLevel(profile.combatLevel);
	const equipBonuses = getEquipmentBonuses(profile.equipment);
	const weaponBonuses = getActiveWeaponBonuses(player);
	const stats: CombatStats = {
		maxHp: baseStats.maxHp + equipBonuses.maxHp + weaponBonuses.maxHp,
		attack: baseStats.attack + equipBonuses.attack + weaponBonuses.attack,
		strength: baseStats.strength + equipBonuses.strength + weaponBonuses.strength,
		defense: baseStats.defense + equipBonuses.defense + weaponBonuses.defense,
	};
	const weaponSpeed = getWeaponAttackSpeed(HotbarService.getActiveItemId(player), DEFAULT_ATTACK_SPEED);

	const humanoid = character.WaitForChild("Humanoid") as Humanoid;
	humanoid.MaxHealth = stats.maxHp;
	humanoid.Health = stats.maxHp;

	playerStates.set(player, {
		currentHp: stats.maxHp,
		maxHp: stats.maxHp,
		stats,
		lastSwingTime: 0,
		attackSpeed: weaponSpeed,
		dead: false,
	});

	humanoid.Died.Connect(() => {
		onPlayerDied(player);
	});

	if (wasRespawn) {
		fireClient(player, "PlayerRespawned", { hp: stats.maxHp, maxHp: stats.maxHp });
	}
}

function onPlayerDied(player: Player): void {
	const state = playerStates.get(player);
	if (!state || state.dead) return;

	state.dead = true;

	const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
	if (humanoid && humanoid.Health > 0) {
		humanoid.Health = 0;
	}

	fireClient(player, "PlayerDied", { respawnTime: RESPAWN_TIME });

	task.delay(RESPAWN_TIME, () => {
		if (player.IsDescendantOf(Players)) {
			player.LoadCharacter();
		}
	});
}

// --- Initialize ---

export function initialize(): void {
	MobService.setMobAttackCallback(damagePlayer);
	EquipmentService.setEquipmentChangeCallback(recalculateStats);
	HotbarService.setHotbarChangedCallback(recalculateStats);

	Players.PlayerAdded.Connect((player) => {
		player.CharacterAdded.Connect((character) => {
			task.spawn(() => onCharacterAdded(player, character));
		});
	});

	for (const player of Players.GetPlayers()) {
		if (player.Character) {
			task.spawn(() => onCharacterAdded(player, player.Character!));
		}
		player.CharacterAdded.Connect((character) => {
			task.spawn(() => onCharacterAdded(player, character));
		});
	}

	Players.PlayerRemoving.Connect((player) => {
		playerStates.delete(player);
	});

	print("[CombatService] Initialized");
}
