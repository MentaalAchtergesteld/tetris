import "./extensions/canvas";
import { AudioManager, EffectsManager } from "./engine/audio";
import { DEFAULT_GAME_SETTINGS } from "@tetris/shared";
import { DEFAULT_CONTROLLER_SETTINGS } from "./engine/input/controller";
import { QuickHUD, HUDPosition } from "./engine/quickhud";
import { DEFAULT_THEME } from "./theme";
import { SprintMode } from "./game/modes/sprint";
import { GameContext, GameMode } from "./game/modes";
import { BlitzMode } from "./game/modes/blitz";
import { MultiplayerMode } from "./game/modes/multiplayer";
import { NetworkClient } from "./engine/network/client";

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

const audioManager = new AudioManager();
const effectsManager = new EffectsManager(audioManager);

const gameContext: GameContext = {
	effects: effectsManager,
	audio: audioManager,
	shakeDecay: 30,
	shakeIntensityMultiplier: 3,
	recoilTension: 150,
	recoilDamping: 30,
	recoilMass: 1,
}

let gamemode: GameMode = new SprintMode();

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
	.addRange("Shake Decay", 1, 100, gameContext.shakeDecay, 1, (val) => gameContext.shakeDecay = val)

	.addRange("Recoil Tension", 1, 500, gameContext.recoilTension, 1, (val) => gameContext.recoilTension = val)
	.addRange("Recoil Damping", 1, 500, gameContext.recoilDamping, 1, (val) => gameContext.recoilDamping = val)
	.addRange("Recoil Mass", 1, 100, gameContext.recoilMass, 1, (val) => gameContext.recoilMass = val)

new QuickHUD("Testing", HUDPosition.BottomRight).setDraggable(true)
	.addFolder("Sound")
	.addButton("1 Line Cleared", () => effectsManager.playLinesCleared(1))
	.addButton("2 Line Cleared", () => effectsManager.playLinesCleared(2))
	.addButton("3 Line Cleared", () => effectsManager.playLinesCleared(3))
	.addButton("4 Line Cleared", () => effectsManager.playLinesCleared(4))
	.addButton("Tetris Cleared", () => effectsManager.playTetrisCleared())
	.addButton("Lock",      () => effectsManager.playLock())
	.addButton("Game Over",      () => effectsManager.playGameOver())
	.parent().addFolder("Game Modes")
	.addButton("40 Lines",    () => { gamemode = new SprintMode();      gamemode.onEnter(gameContext) })
	.addButton("Blitz",       () => { gamemode = new BlitzMode();       gamemode.onEnter(gameContext) })
	.addButton("Multiplayer", () => { gamemode = new MultiplayerMode(); gamemode.onEnter(gameContext) })

let lastTime = 0;
function loop(time: number) {
	const dt = Math.min((time - lastTime) / 1000, 0.1);
	lastTime = time;

	ctx.fillStyle = DEFAULT_THEME.Colors.Background;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.save();

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
