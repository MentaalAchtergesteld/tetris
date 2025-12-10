import { Color } from "./theme";

export class ScreenShake {
	private shakeIntensity: number;
	shakeDecay: number;

	constructor(shakeDecay: number = 30) {
		this.shakeIntensity = 0;
		this.shakeDecay = shakeDecay;
	}

	trigger(intensity: number) { this.shakeIntensity += intensity }

	update(ctx: CanvasRenderingContext2D, dt: number) {
		const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
		const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
		this.shakeIntensity -= dt * this.shakeDecay;
		if (this.shakeIntensity < 0 ) this.shakeIntensity = 0;
		ctx.translate(shakeX, shakeY);
	}
}

export interface ScreenRecoilSettings {
	tension: number;
	damping: number;
	mass: number;
}

export const DEFAULT_RECOIL_SETTINGS: ScreenRecoilSettings = {
	tension: 150,
	damping: 20,
	mass: 1
}

export class ScreenRecoil {
	private y: number = 0;
	private velocity: number = 0;

	constructor(public settings: ScreenRecoilSettings) {}

	trigger(force: number) { this.velocity += force };

	update(ctx: CanvasRenderingContext2D, dt: number) {
		const springForce = -this.settings.tension * this.y;

		const dampingForce = -this.settings.damping * this.velocity;

		const acceleration = (springForce + dampingForce) / this.settings.mass;

		this.velocity += acceleration * dt;
		this.y += this.velocity * dt;

		if (Math.abs(this.y) < 0.1 && Math.abs(this.velocity) < 0.1) {
			this.y = 0;
			this.velocity = 0;
		}

		ctx.translate(0, this.y);
	}
}

export function getTextHeight(text: string, fontSize: number, font: string, ctx: CanvasRenderingContext2D): number {
	ctx.save();
	ctx.font = `${fontSize}px '${font}', sans-serif`;
	const metrics = ctx.measureText(text);
	ctx.restore();
	return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
}

export function drawLabel(
	text: string,
	anchorX: number,
	anchorY: number,
	fontSize: number,
	font: string,
	color: Color,
	ctx: CanvasRenderingContext2D
) {
	ctx.save();

	ctx.font = `${fontSize}px '${font}', sans-serif`;
	ctx.textAlign = "left";
	ctx.textBaseline = "bottom";

	ctx.fillStyle = color;

	ctx.fillText(text, anchorX, anchorY);

	ctx.restore();
}
