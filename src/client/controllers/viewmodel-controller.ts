import { Players, RunService, Workspace, ReplicatedStorage } from "@rbxts/services";
import { EquipmentSlot } from "shared/types/player";
import { ItemConfigs } from "shared/data/items";
import { ViewmodelConfig, SwingStyle } from "shared/data/items/types";
import { onClientEvent } from "client/network/client-network";
import * as CursorController from "./cursor-controller";

// --- State ---

let activeModel: Model | undefined;
let currentConfig: ViewmodelConfig | undefined;

// Animation timers
let idleTime = 0;
let walkBobT = 0;
let swingElapsed = 0;
let swingDuration = 0;
let swinging = false;

// --- Destroy ---

function destroyViewmodel(): void {
	activeModel?.Destroy();
	activeModel = undefined;
	currentConfig = undefined;
}

// --- Build ---

function buildViewmodel(itemId: string): void {
	destroyViewmodel();

	const item = ItemConfigs[itemId];
	if (!item?.viewmodel) return;

	const config = item.viewmodel;
	currentConfig = config;

	if (!config.modelName) return;

	const camera = Workspace.CurrentCamera;
	if (!camera) return;

	const viewmodelsFolder = ReplicatedStorage.FindFirstChild("Viewmodels");
	const template = viewmodelsFolder?.FindFirstChild(config.modelName);
	if (!template?.IsA("Model")) {
		warn(`[ViewmodelController] No model named "${config.modelName}" in ReplicatedStorage.Viewmodels`);
		return;
	}

	const model = template.Clone();
	for (const desc of model.GetDescendants()) {
		if (desc.IsA("BasePart")) {
			desc.CanCollide = false;
			desc.CanQuery = false;
			desc.CastShadow = false;
		}
	}
	model.Parent = camera;
	activeModel = model;
}

// --- Animation ---

function computeSwingDelta(style: SwingStyle, swingValue: number): CFrame {
	switch (style) {
		case SwingStyle.Slash:
			return CFrame.Angles(swingValue * 0.3, 0, -swingValue * math.rad(65)).mul(
				new CFrame(0, 0, -swingValue * 0.12),
			);
		case SwingStyle.Stab:
			return new CFrame(0, 0, -swingValue * 0.45);
		case SwingStyle.Chop:
			return CFrame.Angles(swingValue * math.rad(80), 0, swingValue * 0.08).mul(
				new CFrame(0, swingValue * 0.05, 0),
			);
		case SwingStyle.Cast:
			return CFrame.Angles(-swingValue * math.rad(35), swingValue * math.rad(10), 0);
		default:
			return new CFrame(0,0,0);
	}
}

function setVisibility(hidden: boolean): void {
	if (!activeModel) return;
	const transparency = hidden ? 1 : 0;
	for (const desc of activeModel.GetDescendants()) {
		if (desc.IsA("BasePart")) {
			desc.LocalTransparencyModifier = transparency;
		}
	}
}

// --- Public API ---

/** Trigger a swing animation. Restarts if already mid-swing. */
export function playSwing(): void {
	if (!currentConfig) return;
	swingElapsed = 0;
	swingDuration = currentConfig.swingDuration;
	swinging = true;
}

// --- Update Loop ---

function update(dt: number): void {
	const camera = Workspace.CurrentCamera;
	if (!activeModel || !camera || !currentConfig) return;

	idleTime += dt;

	const hrp = Players.LocalPlayer.Character?.FindFirstChild("HumanoidRootPart") as BasePart | undefined;
	if (hrp && hrp.AssemblyLinearVelocity.Magnitude > 1) {
		walkBobT += dt * 9;
	}

	if (swinging) {
		swingElapsed += dt;
		if (swingElapsed >= swingDuration) {
			swingElapsed = swingDuration;
			swinging = false;
		}
	}

	const idleBobY = math.sin(idleTime * 1.1) * 0.012;
	const walkBobY = math.sin(walkBobT) * 0.035;
	const walkBobX = math.sin(walkBobT * 0.5) * 0.018;

	const swingValue = swinging ? math.sin((swingElapsed / swingDuration) * math.pi) : 0;
	const swingDelta = swinging ? computeSwingDelta(currentConfig.swingStyle, swingValue) : new CFrame();

	const bob = new CFrame(walkBobX, idleBobY + walkBobY, 0);
	activeModel.PivotTo(camera.CFrame.mul(currentConfig.holdOffset).mul(bob).mul(swingDelta));
}

// --- Initialize ---

export function initialize(): void {
	onClientEvent("EquipmentUpdated", (data) => {
		const weaponSlot = data.equipment[EquipmentSlot.Weapon];
		if (weaponSlot) {
			buildViewmodel(weaponSlot.itemId);
		} else {
			destroyViewmodel();
		}
	});

	onClientEvent("PlayerDataLoaded", (profile) => {
		const weaponSlot = profile.equipment[EquipmentSlot.Weapon];
		if (weaponSlot) {
			buildViewmodel(weaponSlot.itemId);
		}
	});

	// Camera instance can change after respawn — rebuild into the new one
	Workspace.GetPropertyChangedSignal("CurrentCamera").Connect(() => {
		destroyViewmodel();
	});

	RunService.BindToRenderStep("ViewmodelUpdate", Enum.RenderPriority.Camera.Value + 1, update);

	print("[ViewmodelController] Initialized");
}
