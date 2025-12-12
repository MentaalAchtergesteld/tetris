import "./extensions/canvas";
import { AudioManager, EffectsManager } from "./engine/audio";
import { DEFAULT_GAME_SETTINGS } from "./game/game";
import { DEFAULT_CONTROLLER_SETTINGS } from "./engine/input";
import { QuickHUD, HUDPosition } from "./engine/quickhud";
import { DEFAULT_THEME } from "./theme";
import { ScreenRecoil, ScreenShake } from "./engine/vfx";
import { SprintMode } from "./game/modes/sprint";
import { GameContext } from "./game/modes";

function createCanvas(): [ HTMLCanvasElement, CanvasRenderingContext2D ] {
	const canvas = document.createElement("canvas") as HTMLCanvasElement;
	const ctx = canvas.getContext("2d");
	if (ctx == null) throw Error("Couldn't get CanvasRenderingContext2D");

	return [canvas, ctx];
}

const [canvas, ctx] = createCanvas();

function setCanvasToWindowSize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

window.addEventListener("resize", setCanvasToWindowSize);
setCanvasToWindowSize();

document.body.appendChild(canvas);

const screenShake = new ScreenShake();

const recoilSettings = {
		tension: 150,
		damping: 30,
		mass: 1,
	}
const screenRecoil = new ScreenRecoil(recoilSettings);

const audioManager = new AudioManager();
const effectsManager = new EffectsManager(audioManager);

const gameContext: GameContext = {
	effects: effectsManager,
	audio: audioManager,
	shake: screenShake,
	shakeIntensityMultiplier: 3,
	recoil: screenRecoil,
	recoilSettings
}

new QuickHUD("Settings", HUDPosition.TopRight).setDraggable(true)
	.addFolder("Game")
	.addRange("Gravity", 0, 10, DEFAULT_GAME_SETTINGS.gravity, 0.1, (val) => DEFAULT_GAME_SETTINGS.gravity = val)
	.addRange("Lock Delay", 0.1, 2, DEFAULT_GAME_SETTINGS.lockDelay, 0.1, (val) => DEFAULT_GAME_SETTINGS.lockDelay= val)

	.parent().addFolder("Handling")
	.addRange("Delayed Auto Shift", 0.01, 1, DEFAULT_CONTROLLER_SETTINGS.das, 0.005, (val) => DEFAULT_CONTROLLER_SETTINGS.das = val)
	.addRange("Auto Repeat Rate", 0.01, 1, DEFAULT_CONTROLLER_SETTINGS.arr, 0.001, (val) => DEFAULT_CONTROLLER_SETTINGS.arr= val)
	.addRange("Soft Drop Factor", 1, 10000, DEFAULT_CONTROLLER_SETTINGS.sdf, 1, (val) => DEFAULT_CONTROLLER_SETTINGS.sdf= val)

	.parent().addFolder("Visual")
	.addRange("Shake Intensity Mult", 0, 20, gameContext.shakeIntensityMultiplier, 0.5, (val) => gameContext.shakeIntensityMultiplier = val)
	.addRange("Shake Decay", 1, 100, screenShake.shakeDecay, 1, (val) => screenShake.shakeDecay = val)

	.addRange("Recoil Tension", 1, 500, recoilSettings.tension, 1, (val) => recoilSettings.tension = val)
	.addRange("Recoil Damping", 1, 500, recoilSettings.damping, 1, (val) => recoilSettings.damping = val)
	.addRange("Recoil Mass", 1, 100, recoilSettings.mass, 1, (val) => recoilSettings.mass = val)

new QuickHUD("Testing", HUDPosition.BottomRight).setDraggable(true)
	.addFolder("Sound")
	.addButton("1 Line Cleared", () => effectsManager.playLinesCleared(1))
	.addButton("2 Line Cleared", () => effectsManager.playLinesCleared(2))
	.addButton("3 Line Cleared", () => effectsManager.playLinesCleared(3))
	.addButton("4 Line Cleared", () => effectsManager.playLinesCleared(4))
	.addButton("Tetris Cleared", () => effectsManager.playTetrisCleared())
	.addButton("Hard Drop",      () => effectsManager.playHardDrop())
	.addButton("Game Over",      () => effectsManager.playGameOver())

const gamemode = new SprintMode();

let lastTime = 0;
function loop(time: number) {
	const dt = Math.min((time - lastTime) / 1000, 0.1);
	lastTime = time;

	ctx.fillStyle = DEFAULT_THEME.Colors.Background;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.save();

	screenRecoil.update(ctx, dt);
	screenShake.update(ctx, dt);

	gamemode.update(dt);
	gamemode.draw(ctx, DEFAULT_THEME);
	

	ctx.restore();

	requestAnimationFrame(loop);
}

async function init() {
	await document.fonts.ready;
	
	gamemode.onEnter(gameContext);

	requestAnimationFrame(loop);
}

init();
