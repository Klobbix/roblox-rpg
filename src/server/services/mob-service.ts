import { Players, Workspace, CollectionService } from "@rbxts/services";
import { CombatStats } from "shared/types/player";
import { MobAIState } from "shared/types/combat";
import { MobConfig, MobConfigs } from "shared/data/mobs";
import { rollDamage } from "shared/data/stats";
import * as EntityService from "./entity-service";
import { EntityType } from "shared/types/entity";
import * as GameLoopService from "./game-loop-service";

// --- Types ---

export interface MobState {
	mobId: string;
	configId: string;
	config: MobConfig;
	instance: Model;
	currentHp: number;
	maxHp: number;
	aiState: MobAIState;
	targetPlayer: Player | undefined;
	lastAttackTime: number;
	spawnPosition: Vector3;
	spawnerId: string | undefined;
}

// --- Constants ---

const KNOCKBACK_DISTANCE = 5.5; // studs pushed away on hit
const HIT_FLASH_DURATION = 0.2; // seconds of red glow
const HIT_FLASH_COLOR = Color3.fromRGB(255, 50, 50);

// --- State ---

let mobIdCounter = 0;
const mobs = new Map<string, MobState>();

/** Callback for when a mob attacks a player. Set by CombatService to avoid circular deps. */
type MobAttackCallback = (attackerStats: CombatStats, targetPlayer: Player) => void;
let onMobAttackPlayer: MobAttackCallback = () => {};

/** Callback for when a mob dies. Set by SpawnerService. */
type MobDeathCallback = (mobId: string, spawnerId: string | undefined) => void;
let onMobDeathCallback: MobDeathCallback = () => {};

// --- Callback Registration ---

export function setMobAttackCallback(cb: MobAttackCallback): void {
	onMobAttackPlayer = cb;
}

export function setMobDeathCallback(cb: MobDeathCallback): void {
	onMobDeathCallback = cb;
}

// --- Mob Factory ---

function createMobModel(config: MobConfig, position: Vector3, mobId: string): Model {
	const model = new Instance("Model");
	model.Name = `${config.name}_${mobId}`;

	// Body
	const rootPart = new Instance("Part");
	rootPart.Name = "HumanoidRootPart";
	rootPart.Size = new Vector3(2, 3, 1);
	rootPart.Anchored = true;
	rootPart.CanCollide = true;
	rootPart.Color = Color3.fromRGB(180, 60, 60);
	rootPart.CFrame = new CFrame(position.X, position.Y, position.Z);
	rootPart.Parent = model;

	// Head (for Humanoid name display)
	const head = new Instance("Part");
	head.Name = "Head";
	head.Size = new Vector3(1.5, 1.5, 1.5);
	head.Shape = Enum.PartType.Ball;
	head.Anchored = false;
	head.CanCollide = false;
	head.Color = Color3.fromRGB(200, 80, 80);
	head.CFrame = rootPart.CFrame.mul(new CFrame(0, 2.25, 0));
	head.Parent = model;

	// Weld head to body
	const weld = new Instance("WeldConstraint");
	weld.Part0 = rootPart;
	weld.Part1 = head;
	weld.Parent = model;

	// Humanoid (for built-in health bar + name display)
	const humanoid = new Instance("Humanoid");
	humanoid.MaxHealth = config.stats.maxHp;
	humanoid.Health = config.stats.maxHp;
	humanoid.DisplayName = `${config.name} [Lv.${config.level}]`;
	humanoid.HealthDisplayType = Enum.HumanoidHealthDisplayType.AlwaysOn;
	humanoid.Parent = model;

	// Store mob ID as attribute for client-side identification
	model.SetAttribute("MobId", mobId);
	model.SetAttribute("ConfigId", config.id);

	model.PrimaryPart = rootPart;
	model.Parent = Workspace;

	return model;
}

// --- Public API ---

/** Spawn a mob from config at a position. Returns the mobId. */
export function spawnMob(configId: string, position: Vector3, spawnerId?: string): string {
	const config = MobConfigs[configId];
	if (!config) {
		warn(`[MobService] Unknown mob config: ${configId}`);
		return "";
	}

	mobIdCounter++;
	const mobId = `mob_${mobIdCounter}`;

	const instance = createMobModel(config, position, mobId);
	EntityService.registerEntity(instance, EntityType.Mob, configId);

	const state: MobState = {
		mobId,
		configId,
		config,
		instance,
		currentHp: config.stats.maxHp,
		maxHp: config.stats.maxHp,
		aiState: MobAIState.Idle,
		targetPlayer: undefined,
		lastAttackTime: 0,
		spawnPosition: position,
		spawnerId,
	};

	mobs.set(mobId, state);
	return mobId;
}

/** Get a mob's runtime state. */
export function getMobState(mobId: string): MobState | undefined {
	return mobs.get(mobId);
}

interface PartSnapshot {
	part: BasePart;
	color: Color3;
	material: Enum.Material;
}

/** Apply knockback and a brief red flash to a mob that was just hit. */
function applyHitEffects(mob: MobState, attackerPosition?: Vector3): void {
	const primaryPart = mob.instance.PrimaryPart;
	if (!primaryPart) return;

	// Knockback — push mob away from attacker on the horizontal plane
	if (attackerPosition) {
		const mobPos = primaryPart.Position;
		const flat = new Vector3(mobPos.X - attackerPosition.X, 0, mobPos.Z - attackerPosition.Z);
		if (flat.Magnitude > 0) {
			primaryPart.CFrame = primaryPart.CFrame.add(flat.Unit.mul(KNOCKBACK_DISTANCE));
		}
	}

	// Red flash — save original colors, set Neon red, restore after delay
	const snapshots: PartSnapshot[] = [];
	for (const child of mob.instance.GetDescendants()) {
		if (child.IsA("BasePart")) {
			snapshots.push({ part: child, color: child.Color, material: child.Material });
			child.Color = HIT_FLASH_COLOR;
			child.Material = Enum.Material.Neon;
		}
	}

	task.delay(HIT_FLASH_DURATION, () => {
		for (const snapshot of snapshots) {
			if (snapshot.part.IsDescendantOf(Workspace)) {
				snapshot.part.Color = snapshot.color;
				snapshot.part.Material = snapshot.material;
			}
		}
	});
}

/** Apply damage to a mob. Returns whether it died and current HP. */
export function damageMob(
	mobId: string,
	damage: number,
	attacker?: Player,
): { died: boolean; newHp: number } {
	const mob = mobs.get(mobId);
	if (!mob || mob.aiState === MobAIState.Dead) {
		return { died: false, newHp: 0 };
	}

	mob.currentHp = math.max(0, mob.currentHp - damage);

	// Sync Humanoid health for visual display
	const humanoid = mob.instance.FindFirstChildOfClass("Humanoid");
	if (humanoid) {
		humanoid.Health = mob.currentHp;
	}

	// Aggro to attacker if not already targeting someone
	if (attacker && !mob.targetPlayer) {
		mob.targetPlayer = attacker;
		mob.aiState = MobAIState.Chase;
	}

	if (mob.currentHp <= 0) {
		killMob(mobId);
		return { died: true, newHp: 0 };
	}

	// Visual hit feedback (only when mob survives — no point flashing a corpse)
	const attackerRoot = attacker?.Character?.FindFirstChild("HumanoidRootPart") as
		| BasePart
		| undefined;
	applyHitEffects(mob, attackerRoot?.Position);

	return { died: false, newHp: mob.currentHp };
}

/** Force-aggro a mob onto a player. */
export function aggroMob(mobId: string, player: Player): void {
	const mob = mobs.get(mobId);
	if (!mob || mob.aiState === MobAIState.Dead) return;

	mob.targetPlayer = player;
	if (mob.aiState === MobAIState.Idle || mob.aiState === MobAIState.Reset) {
		mob.aiState = MobAIState.Chase;
	}
}

/** Destroy a mob and clean up. */
function killMob(mobId: string): void {
	const mob = mobs.get(mobId);
	if (!mob) return;

	mob.aiState = MobAIState.Dead;
	mob.targetPlayer = undefined;

	EntityService.unregisterEntity(mob.instance);
	mob.instance.Destroy();
	mobs.delete(mobId);

	onMobDeathCallback(mobId, mob.spawnerId);
}

// --- AI State Machine ---

function updateAllMobs(dt: number): void {
	mobs.forEach((mob) => {
		if (mob.aiState !== MobAIState.Dead) {
			updateMob(mob, dt);
		}
	});
}

function updateMob(mob: MobState, dt: number): void {
	switch (mob.aiState) {
		case MobAIState.Idle:
			updateIdle(mob);
			break;
		case MobAIState.Chase:
			updateChase(mob, dt);
			break;
		case MobAIState.Attack:
			updateAttack(mob);
			break;
		case MobAIState.Reset:
			updateReset(mob, dt);
			break;
	}
}

function updateIdle(mob: MobState): void {
	if (mob.config.aggroRange <= 0) return; // Passive mob

	const mobPos = mob.instance.PrimaryPart!.Position;

	for (const player of Players.GetPlayers()) {
		const rootPart = player.Character?.FindFirstChild("HumanoidRootPart") as Part | undefined;
		if (!rootPart) continue;

		// Don't aggro dead players
		const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
		if (!humanoid || humanoid.Health <= 0) continue;

		const distance = rootPart.Position.sub(mobPos).Magnitude;
		if (distance <= mob.config.aggroRange) {
			mob.targetPlayer = player;
			mob.aiState = MobAIState.Chase;
			return;
		}
	}
}

function updateChase(mob: MobState, dt: number): void {
	if (!isTargetValid(mob)) {
		mob.aiState = MobAIState.Reset;
		mob.targetPlayer = undefined;
		return;
	}

	const mobPos = mob.instance.PrimaryPart!.Position;
	const targetPos = getTargetPosition(mob)!;
	const distance = targetPos.sub(mobPos).Magnitude;

	// Leash check
	const distFromSpawn = mobPos.sub(mob.spawnPosition).Magnitude;
	if (distFromSpawn > mob.config.leashRange) {
		mob.aiState = MobAIState.Reset;
		mob.targetPlayer = undefined;
		return;
	}

	// In attack range?
	if (distance <= mob.config.attackRange) {
		mob.aiState = MobAIState.Attack;
		return;
	}

	// Move toward target
	const direction = targetPos.sub(mobPos).Unit;
	const moveDistance = math.min(mob.config.walkSpeed * dt, distance);
	const newPos = mobPos.add(direction.mul(moveDistance));

	// Face target (horizontal only)
	const flatTarget = new Vector3(targetPos.X, newPos.Y, targetPos.Z);
	mob.instance.PrimaryPart!.CFrame = CFrame.lookAt(newPos, flatTarget);
}

function updateAttack(mob: MobState): void {
	if (!isTargetValid(mob)) {
		mob.aiState = MobAIState.Reset;
		mob.targetPlayer = undefined;
		return;
	}

	const mobPos = mob.instance.PrimaryPart!.Position;
	const targetPos = getTargetPosition(mob)!;
	const distance = targetPos.sub(mobPos).Magnitude;

	// Target moved out of range
	if (distance > mob.config.attackRange * 1.2) {
		mob.aiState = MobAIState.Chase;
		return;
	}

	// Attack cooldown check
	const now = os.clock();
	if (now - mob.lastAttackTime < mob.config.attackSpeed) return;

	mob.lastAttackTime = now;

	// Deal damage via callback (CombatService handles defense/HP)
	onMobAttackPlayer(mob.config.stats, mob.targetPlayer!);
}

function updateReset(mob: MobState, dt: number): void {
	const mobPos = mob.instance.PrimaryPart!.Position;
	const distance = mobPos.sub(mob.spawnPosition).Magnitude;

	// Close enough to spawn — idle and heal
	if (distance <= 1) {
		mob.instance.PrimaryPart!.CFrame = new CFrame(
			mob.spawnPosition.X,
			mob.spawnPosition.Y,
			mob.spawnPosition.Z,
		);
		mob.aiState = MobAIState.Idle;
		mob.currentHp = mob.maxHp;

		const humanoid = mob.instance.FindFirstChildOfClass("Humanoid");
		if (humanoid) {
			humanoid.Health = mob.maxHp;
		}
		return;
	}

	// Move back to spawn
	const direction = mob.spawnPosition.sub(mobPos).Unit;
	const moveDistance = math.min(mob.config.walkSpeed * 1.5 * dt, distance);
	const newPos = mobPos.add(direction.mul(moveDistance));

	const flatSpawn = new Vector3(mob.spawnPosition.X, newPos.Y, mob.spawnPosition.Z);
	mob.instance.PrimaryPart!.CFrame = CFrame.lookAt(newPos, flatSpawn);
}

// --- Helpers ---

function isTargetValid(mob: MobState): boolean {
	if (!mob.targetPlayer) return false;
	if (!mob.targetPlayer.IsDescendantOf(Players)) return false;

	const character = mob.targetPlayer.Character;
	if (!character) return false;

	const humanoid = character.FindFirstChildOfClass("Humanoid");
	if (!humanoid || humanoid.Health <= 0) return false;

	return true;
}

function getTargetPosition(mob: MobState): Vector3 | undefined {
	const rootPart = mob.targetPlayer?.Character?.FindFirstChild(
		"HumanoidRootPart",
	) as Part | undefined;
	return rootPart?.Position;
}

// --- Initialize ---

export function initialize(): void {
	GameLoopService.registerSystem("MobAI", 10, updateAllMobs);
	print("[MobService] Initialized");
}
