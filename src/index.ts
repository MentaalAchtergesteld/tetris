import { Game } from "./game";
import { LocalController } from "./input";
import { QuickHUD } from "./quickhud";

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

new QuickHUD("Controller Settings").setDraggable(true)
	.addRange("DAS", 0.01, 1, 0.075, 0.005, (val) => controller.settings.das = val)
	.addRange("ARR", 0.01, 1, 0.002, 0.001, (val) => controller.settings.arr= val)
	.addRange("SDF", 1, 1000, 1000, 1, (val) => controller.settings.sdf= val)
	.addRange("Gravity", 0.1, 10, 1, 0.1, (val) => game.settings.gravity = val)
	.addRange("Lock Delay", 0.1, 2, 0.5, 0.1, (val) => game.settings.lockDelay= val);

let lastTime = 0;
function loop(time: number) {
	const dt = (time - lastTime) / 1000;
	lastTime = time;

	game.update(dt);
	controller.update(dt);
	renderGame(game, ctx);

	requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
