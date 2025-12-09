import { Game } from "./game";
import { LocalController } from "./input";
import { QuickHUD, HUDPosition } from "./quickhud";
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

function renderGame(game: Game, ctx: CanvasRenderingContext2D) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	game.draw(ctx);
}

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
});

game.events.on("lock", () => {
	screenRecoil.trigger(100);
})

let lastTime = 0;
function loop(time: number) {
	const dt = (time - lastTime) / 1000;
	lastTime = time;

	game.update(dt);
	controller.update(dt);

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.save();
	ctx.translate(canvas.width/2, canvas.height/2);

	screenRecoil.update(ctx, dt);
	screenShake.update(ctx, dt);
	renderGame(game, ctx);

	ctx.restore();

	requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
