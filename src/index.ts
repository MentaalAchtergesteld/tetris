import { Game } from "./game";
import { LocalController } from "./input";
import { QuickHUD, HUDPosition } from "./quickhud";

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

const settings = new QuickHUD("Controller Settings").setDraggable(true)
	.addRange("DAS", 0.01, 1, 0.075, 0.005, (val) => controller.settings.das = val)
	.addRange("ARR", 0.01, 1, 0.002, 0.001, (val) => controller.settings.arr= val)
	.addRange("SDF", 1, 1000, 1000, 1, (val) => controller.settings.sdf= val)
	.addRange("Gravity", 0.1, 10, 1, 0.1, (val) => game.settings.gravity = val)
	.addRange("Lock Delay", 0.1, 2, 0.5, 0.1, (val) => game.settings.lockDelay= val);

const stats = new QuickHUD("Statistics", HUDPosition.TopLeft).setDraggable(true)

const setRowsClearedLabel = stats.addLabeledValue("Rows Cleared", 0);

class ScreenShake {
	private shakeIntensity: number;
	private shakeDecay: number;

	constructor(shakeDecay: number = 30) {
		this.shakeIntensity = 0;
		this.shakeDecay = shakeDecay;
	}

	shake(intensity: number) { this.shakeIntensity = intensity }

	update(ctx: CanvasRenderingContext2D, dt: number) {
		const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
		const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
		this.shakeIntensity -= dt * this.shakeDecay;
		if (this.shakeIntensity < 0 ) this.shakeIntensity = 0;
		ctx.translate(shakeX, shakeY);
	}
}

const screenShake = new ScreenShake();

let totalClearedRows = 0;
game.events.on("lineClear", (count) => {
	screenShake.shake(3 * count);
	totalClearedRows += count;
	setRowsClearedLabel(totalClearedRows);
});

let lastTime = 0;
function loop(time: number) {
	const dt = (time - lastTime) / 1000;
	lastTime = time;

	game.update(dt);
	controller.update(dt);

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.save();
	ctx.translate(canvas.width/2, canvas.height/2);

	screenShake.update(ctx, dt);
	renderGame(game, ctx);

	ctx.restore();

	requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
