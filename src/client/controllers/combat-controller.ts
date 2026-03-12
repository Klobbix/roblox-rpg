import { Players, UserInputService, Workspace } from "@rbxts/services";
import { fireServer, onClientEvent } from "client/network/client-network";
import * as ViewmodelController from "./viewmodel-controller";

const localPlayer = Players.LocalPlayer;
const mouse = localPlayer.GetMouse();

let inCombat = false;

/** Walk up parent tree to find a Model with a MobId attribute. */
function findMobModel(part: BasePart): Model | undefined {
	let current: Instance | undefined = part;
	while (current) {
		if (current.IsA("Model") && current.GetAttribute("MobId") !== undefined) {
			return current;
		}
		current = current.Parent as Instance | undefined;
	}
	return undefined;
}

/** Show a floating damage number above a world position. */
function showDamageNumber(position: Vector3, damage: number, isMiss: boolean): void {
	const part = new Instance("Part");
	part.Name = "DamageNumber";
	part.Anchored = true;
	part.CanCollide = false;
	part.Transparency = 1;
	part.Size = new Vector3(1, 1, 1);
	part.Position = position.add(new Vector3(math.random() * 2 - 1, 3, math.random() * 2 - 1));
	part.Parent = Workspace;

	const billboard = new Instance("BillboardGui");
	billboard.Adornee = part;
	billboard.Size = new UDim2(0, 80, 0, 40);
	billboard.StudsOffset = new Vector3(0, 0, 0);
	billboard.AlwaysOnTop = true;
	billboard.Parent = part;

	const label = new Instance("TextLabel");
	label.Size = UDim2.fromScale(1, 1);
	label.BackgroundTransparency = 1;
	label.Text = isMiss ? "Miss" : tostring(damage);
	label.TextColor3 = isMiss
		? Color3.fromRGB(150, 150, 150)
		: Color3.fromRGB(255, 255, 50);
	label.TextScaled = true;
	label.Font = Enum.Font.GothamBold;
	label.TextStrokeTransparency = 0.5;
	label.TextStrokeColor3 = Color3.fromRGB(0, 0, 0);
	label.Parent = billboard;

	// Float up and fade
	task.spawn(() => {
		for (let i = 0; i < 20; i++) {
			task.wait(0.05);
			part.Position = part.Position.add(new Vector3(0, 0.08, 0));
			label.TextTransparency = i / 20;
			label.TextStrokeTransparency = 0.5 + (i / 20) * 0.5;
		}
		part.Destroy();
	});
}

/** Show damage taken as a red number near the player. */
function showDamageTaken(damage: number): void {
	const character = localPlayer.Character;
	const rootPart = character?.FindFirstChild("HumanoidRootPart") as Part | undefined;
	if (!rootPart) return;

	const part = new Instance("Part");
	part.Name = "DamageTaken";
	part.Anchored = true;
	part.CanCollide = false;
	part.Transparency = 1;
	part.Size = new Vector3(1, 1, 1);
	part.Position = rootPart.Position.add(new Vector3(math.random() * 2 - 1, 3, 0));
	part.Parent = Workspace;

	const billboard = new Instance("BillboardGui");
	billboard.Adornee = part;
	billboard.Size = new UDim2(0, 80, 0, 40);
	billboard.AlwaysOnTop = true;
	billboard.Parent = part;

	const label = new Instance("TextLabel");
	label.Size = UDim2.fromScale(1, 1);
	label.BackgroundTransparency = 1;
	label.Text = damage === 0 ? "Block" : tostring(damage);
	label.TextColor3 = damage === 0
		? Color3.fromRGB(100, 100, 255)
		: Color3.fromRGB(255, 50, 50);
	label.TextScaled = true;
	label.Font = Enum.Font.GothamBold;
	label.TextStrokeTransparency = 0.5;
	label.TextStrokeColor3 = Color3.fromRGB(0, 0, 0);
	label.Parent = billboard;

	task.spawn(() => {
		for (let i = 0; i < 20; i++) {
			task.wait(0.05);
			part.Position = part.Position.add(new Vector3(0, 0.08, 0));
			label.TextTransparency = i / 20;
			label.TextStrokeTransparency = 0.5 + (i / 20) * 0.5;
		}
		part.Destroy();
	});
}

/** Find a mob Model in Workspace by its MobId attribute. */
function findMobById(mobId: string): Model | undefined {
	for (const child of Workspace.GetChildren()) {
		if (child.IsA("Model") && child.GetAttribute("MobId") === mobId) {
			return child;
		}
	}
	return undefined;
}

export function initialize(): void {
	// Click to engage combat
	UserInputService.InputBegan.Connect((input, gameProcessed) => {
		if (gameProcessed) return;
		if (input.UserInputType !== Enum.UserInputType.MouseButton1) return;

		const target = mouse.Target;
		if (!target) return;

		const mobModel = findMobModel(target);
		if (mobModel) {
			const mobId = mobModel.GetAttribute("MobId") as string;
			if (mobId) {
				fireServer("EngageCombat", { mobId });
			}
		}
	});

	// Escape to disengage
	UserInputService.InputBegan.Connect((input, gameProcessed) => {
		if (input.KeyCode === Enum.KeyCode.Escape && inCombat) {
			fireServer("DisengageCombat", undefined);
		}
	});

	// --- Event Listeners ---

	onClientEvent("CombatStarted", (data) => {
		inCombat = true;
		print(`[Combat] Engaging mob ${data.mobId}`);
	});

	onClientEvent("CombatEnded", (data) => {
		inCombat = false;
		print(`[Combat] Disengaged: ${data.reason}`);
	});

	onClientEvent("DamageDealt", (data) => {
		ViewmodelController.playSwing();
		const mobModel = findMobById(data.mobId);
		if (mobModel && mobModel.PrimaryPart) {
			showDamageNumber(mobModel.PrimaryPart.Position, data.damage, data.damage === 0);
		}
	});

	onClientEvent("DamageTaken", (data) => {
		showDamageTaken(data.damage);
	});

	onClientEvent("ExpGained", (data) => {
		print(`[EXP] +${data.amount} EXP (Total: ${data.totalExp}, Level: ${data.level})`);
	});

	onClientEvent("LevelUp", (data) => {
		print(`[LEVEL UP!] You are now combat level ${data.newLevel}!`);
	});

	onClientEvent("MobDied", (data) => {
		print(`[Combat] Mob defeated! +${data.expReward} EXP`);
	});

	onClientEvent("PlayerDied", (data) => {
		print(`[Death] You died! Respawning in ${data.respawnTime}s...`);
		inCombat = false;
	});

	onClientEvent("PlayerRespawned", (data) => {
		print(`[Respawn] Welcome back! HP: ${data.hp}/${data.maxHp}`);
	});

	print("[CombatController] Initialized");
}
