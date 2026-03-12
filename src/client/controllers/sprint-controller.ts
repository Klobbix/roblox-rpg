import { Players, UserInputService, RunService } from "@rbxts/services";

const localPlayer = Players.LocalPlayer;
const playerGui = localPlayer.WaitForChild("PlayerGui") as PlayerGui;

// --- Constants ---

const WALK_SPEED = 16;
const SPRINT_SPEED = 26;
const MAX_STAMINA = 100;
/** Stamina drained per second while sprinting */
const DRAIN_RATE = 22;
/** Stamina regenerated per second while not sprinting */
const REGEN_RATE = 10;
/** Seconds after stopping sprint before regeneration begins */
const REGEN_DELAY = 1.2;

const BAR_BG_COLOR = Color3.fromRGB(40, 40, 40);
const STAMINA_COLOR = Color3.fromRGB(255, 200, 40);
const STAMINA_LOW_COLOR = Color3.fromRGB(255, 100, 30);

// --- State ---

let stamina = MAX_STAMINA;
let sprinting = false;
let lastSprintStopTime = -REGEN_DELAY; // allow regen immediately on load

// --- UI References ---

let staminaBarContainer: Frame;
let staminaBarFill: Frame;

// --- UI ---

function createStaminaBar(): void {
	const screenGui = new Instance("ScreenGui");
	screenGui.Name = "StaminaHUD";
	screenGui.ResetOnSpawn = false;
	screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling;
	screenGui.DisplayOrder = -1;
	screenGui.Parent = playerGui;

	const barWidth = 200;
	const barHeight = 8;

	staminaBarContainer = new Instance("Frame");
	staminaBarContainer.Name = "StaminaBar";
	staminaBarContainer.Size = new UDim2(0, barWidth, 0, barHeight);
	staminaBarContainer.Position = new UDim2(0.5, -barWidth / 2, 0, 44);
	staminaBarContainer.BackgroundColor3 = BAR_BG_COLOR;
	staminaBarContainer.BorderSizePixel = 0;
	staminaBarContainer.Parent = screenGui;

	const corner = new Instance("UICorner");
	corner.CornerRadius = new UDim(0, 3);
	corner.Parent = staminaBarContainer;

	staminaBarFill = new Instance("Frame");
	staminaBarFill.Name = "Fill";
	staminaBarFill.Size = UDim2.fromScale(1, 1);
	staminaBarFill.BackgroundColor3 = STAMINA_COLOR;
	staminaBarFill.BorderSizePixel = 0;
	staminaBarFill.Parent = staminaBarContainer;

	const fillCorner = new Instance("UICorner");
	fillCorner.CornerRadius = new UDim(0, 3);
	fillCorner.Parent = staminaBarFill;
}

function updateStaminaBar(): void {
	const fraction = math.clamp(stamina / MAX_STAMINA, 0, 1);
	staminaBarFill.Size = new UDim2(fraction, 0, 1, 0);
	staminaBarFill.BackgroundColor3 = fraction < 0.3 ? STAMINA_LOW_COLOR : STAMINA_COLOR;
	// Hide when full and not sprinting
	staminaBarContainer.Visible = sprinting || stamina < MAX_STAMINA;
}

// --- Initialize ---

export function initialize(): void {
	createStaminaBar();

	RunService.RenderStepped.Connect((dt) => {
		const character = localPlayer.Character;
		const humanoid = character?.FindFirstChildOfClass("Humanoid");
		if (!humanoid || humanoid.Health <= 0) return;

		const shiftHeld =
			UserInputService.IsKeyDown(Enum.KeyCode.LeftShift) ||
			UserInputService.IsKeyDown(Enum.KeyCode.RightShift);

		const now = tick();

		if (shiftHeld && stamina > 0) {
			stamina = math.max(0, stamina - DRAIN_RATE * dt);
			sprinting = true;
			lastSprintStopTime = now;
			humanoid.WalkSpeed = SPRINT_SPEED;
		} else {
			if (sprinting) {
				lastSprintStopTime = now;
			}
			sprinting = false;
			humanoid.WalkSpeed = WALK_SPEED;

			if (now - lastSprintStopTime >= REGEN_DELAY) {
				stamina = math.min(MAX_STAMINA, stamina + REGEN_RATE * dt);
			}
		}

		updateStaminaBar();
	});

	print("[SprintController] Initialized — Hold Shift to sprint");
}
