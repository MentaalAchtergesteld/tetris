import "./extensions/canvas";

import { AudioManager, EffectsManager } from "./audio";
import { Game } from "./game/game";
import { LocalController } from "./input";
import { QuickHUD, HUDPosition } from "./quickhud";
import { BoardWidget, HoldContainerWidget, HorizontalContainerWidget, PieceQueueWidget } from "./render/widget";
import { DEFAULT_THEME } from "./theme";
import { ScreenRecoil, ScreenRecoilSettings, ScreenShake } from "./visuals";


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

const game = new Game();
game.reset();

const controller = new LocalController(game);

const screenShake = new ScreenShake();
let shakeIntensityMultiplier = 3;

const recoilSettings: ScreenRecoilSettings = {
	tension: 150,
	damping: 30,
	mass: 1
};
const screenRecoil = new ScreenRecoil(recoilSettings);

const audioManager = new AudioManager();
const effectsManager = new EffectsManager(audioManager);

new QuickHUD("Settings", HUDPosition.TopRight).setDraggable(true)
	.addFolder("Game")
	.addRange("Gravity", 0.1, 10, game.settings.gravity, 0.1, (val) => game.settings.gravity = val)
	.addRange("Lock Delay", 0.1, 2, game.settings.lockDelay, 0.1, (val) => game.settings.lockDelay= val)

	.parent().addFolder("Handling")
	.addRange("Delayed Auto Shift", 0.01, 1, controller.settings.das, 0.005, (val) => controller.settings.das = val)
	.addRange("Auto Repeat Rate", 0.01, 1, controller.settings.arr, 0.001, (val) => controller.settings.arr= val)
	.addRange("Soft Drop Factor", 1, 1000, controller.settings.sdf, 1, (val) => controller.settings.sdf= val)

	.parent().addFolder("Visual")
	.addRange("Shake Intensity Mult", 0, 20, shakeIntensityMultiplier, 0.5, (val) => shakeIntensityMultiplier = val)
	.addRange("Shake Decay", 1, 100, screenShake.shakeDecay, 1, (val) => screenShake.shakeDecay = val)

	.addRange("Recoil Tension", 1, 500, recoilSettings.tension, 1, (val) => recoilSettings.tension = val)
	.addRange("Recoil Damping", 1, 500, recoilSettings.damping, 1, (val) => recoilSettings.damping = val)
	.addRange("Recoil Mass", 1, 100, recoilSettings.mass, 1, (val) => recoilSettings.mass = val)

const stats = new QuickHUD("Statistics", HUDPosition.TopLeft).setDraggable(true)

new QuickHUD("Testing", HUDPosition.BottomRight).setDraggable(true)
	.addFolder("Sound")
	.addButton("1 Line Cleared", () => effectsManager.playLinesCleared(1))
	.addButton("2 Line Cleared", () => effectsManager.playLinesCleared(2))
	.addButton("3 Line Cleared", () => effectsManager.playLinesCleared(3))
	.addButton("4 Line Cleared", () => effectsManager.playLinesCleared(4))
	.addButton("Tetris Cleared", () => effectsManager.playTetrisCleared())
	.addButton("Hard Drop",      () => effectsManager.playHardDrop())
	.addButton("Game Over",      () => effectsManager.playGameOver())

const setRowsClearedLabel = stats.addLabeledValue("Rows Cleared", 0);

let totalClearedRows = 0;
game.events.on("lineClear", (count) => {
	screenShake.trigger(shakeIntensityMultiplier * count);
	totalClearedRows += count;
	setRowsClearedLabel(totalClearedRows);

	if (count < 4) {
		effectsManager.playLinesCleared(count);
	} else {
		effectsManager.playTetrisCleared();
	}
});

game.events.on("lock", () => {
	screenRecoil.trigger(100);
})

game.events.on("hardDrop", () => effectsManager.playHardDrop());
game.events.on("gameOver", () => effectsManager.playGameOver());

const UI = new HorizontalContainerWidget([
	new HoldContainerWidget(() => game.hold.piece),
	new BoardWidget(
		() => game.board.grid,
		() => { return { width: game.board.width, height: game.board.height } },
		() => game.currentPiece,
		() => game.getLowestPosition(),
	),
	new PieceQueueWidget(() => game.queue.peek(5)),
], 16);

let lastTime = 0;
function loop(time: number) {
	const dt = Math.min((time - lastTime) / 1000, 0.1);
	lastTime = time;

	game.update(dt);
	controller.update(dt);

	ctx.fillStyle = DEFAULT_THEME.Colors.Background;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.save();
	ctx.translate(canvas.width/2, canvas.height/2);
	ctx.translate(-UI.getWidth(DEFAULT_THEME)/2, -UI.getHeight(DEFAULT_THEME)/2);

	screenRecoil.update(ctx, dt);
	screenShake.update(ctx, dt);

	UI.draw(ctx, 0, 0, DEFAULT_THEME);
	

	ctx.restore();

	requestAnimationFrame(loop);
}

async function init() {
	await document.fonts.ready;
	game.start();
	requestAnimationFrame(loop);
}

init();
