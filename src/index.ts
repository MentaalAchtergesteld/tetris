import { AudioManager } from "./audio";
import { Game } from "./game";
import { LocalController } from "./input";
import { QuickHUD, HUDPosition } from "./quickhud";
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
game.nextPiece();

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

new QuickHUD("Settings").setDraggable(true)
	.addFolder("Game")
	.addRange("Gravity", 0.1, 10, game.settings.gravity, 0.1, (val) => game.settings.gravity = val)
	.addRange("Lock Delay", 0.1, 2, game.settings.lockDelay, 0.1, (val) => game.settings.lockDelay= val)

	.parent().addFolder("Handling")
	.addRange("DAS", 0.01, 1, controller.settings.das, 0.005, (val) => controller.settings.das = val)
	.addRange("ARR", 0.01, 1, controller.settings.arr, 0.001, (val) => controller.settings.arr= val)
	.addRange("SDF", 1, 1000, controller.settings.sdf, 1, (val) => controller.settings.sdf= val)

	.parent().addFolder("Visual")
	.addRange("Shake Intensity Mult", 0, 20, shakeIntensityMultiplier, 0.5, (val) => shakeIntensityMultiplier = val)
	.addRange("Shake Decay", 1, 100, screenShake.shakeDecay, 1, (val) => screenShake.shakeDecay = val)

	.addRange("Recoil Tension", 1, 500, recoilSettings.tension, 1, (val) => recoilSettings.tension = val)
	.addRange("Recoil Damping", 1, 500, recoilSettings.damping, 1, (val) => recoilSettings.damping = val)
	.addRange("Recoil Mass", 1, 100, recoilSettings.mass, 1, (val) => recoilSettings.mass = val)

const stats = new QuickHUD("Statistics", HUDPosition.TopLeft).setDraggable(true)

const setRowsClearedLabel = stats.addLabeledValue("Rows Cleared", 0);

let totalClearedRows = 0;
game.events.on("lineClear", (count) => {
	screenShake.trigger(shakeIntensityMultiplier * count);
	totalClearedRows += count;
	setRowsClearedLabel(totalClearedRows);

	const baseFreq = 523.25;
	if (count < 4) {
		const freq = baseFreq * (1 + (count * 0.25));
		audioManager.playSine(freq, 0.3, 0.2);
		audioManager.playSplash(0.3, 2000, 0.15);
	} else {
		audioManager.playSquare(baseFreq, 0.4, 0.1);
		setTimeout(() => audioManager.playSquare(baseFreq * 1.25, 0.4, 0.1), 50);
		setTimeout(() => audioManager.playSquare(baseFreq * 1.5, 0.4, 0.1), 100);
		setTimeout(() => audioManager.playSquare(baseFreq * 2, 0.6, 0.2), 150);

		audioManager.playSplash(0.6, 1500, 0.4); 
		
		audioManager.playTriangleSlide(400, 1200, 0.5, 0.2);
	}
});

game.events.on("lock", () => {
	screenRecoil.trigger(100);
})

game.events.on("hardDrop", () => {
	audioManager.playTriangle(100, 0.15, 1);
})

let lastTime = 0;
function loop(time: number) {
	const dt = (time - lastTime) / 1000;
	lastTime = time;

	game.update(dt);
	controller.update(dt);

	ctx.fillStyle = DEFAULT_THEME.Background;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.save();
	ctx.translate(canvas.width/2, canvas.height/2);

	screenRecoil.update(ctx, dt);
	screenShake.update(ctx, dt);

	game.draw(DEFAULT_THEME, ctx);

	ctx.restore();

	requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
