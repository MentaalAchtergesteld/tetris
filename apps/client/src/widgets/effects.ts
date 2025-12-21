import { GameTheme } from "../../theme";
import { Size, Widget } from "../widget";

export const Easing = {
	easeOutCubic: (t: number): number => {
		return 1 - Math.pow(1 - t, 3);
	},

	easeOutSpring: (t: number): number => {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return 1 + c3 * Math.pow(t-1, 3) + c1 * Math.pow(t - 1, 2);
	}
}

export class Opacity extends Widget {
	constructor(
		private opacityProvider: () => number,
		private child: Widget,
	) { super(); }

	getMinSize(theme: GameTheme): Size {
		return this.child.getMinSize(theme); 
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: GameTheme): void {
		const opacity = Math.max(0, Math.min(1, this.opacityProvider())); 

		ctx.save();
		ctx.globalAlpha = opacity;
		this.child.draw(ctx, x, y, w, h, theme);
		ctx.restore();
	}
}

export class Scale extends Widget {
	constructor(
		private scaleProvider: () => number,
		private child: Widget,
	) { super(); }

	getMinSize(theme: GameTheme): Size {
		return this.child.getMinSize(theme); 
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: GameTheme): void {
		const scale = this.scaleProvider();
        
		const cx = x + w / 2;
		const cy = y + h / 2;

		ctx.save();
		ctx.translate(cx, cy);
		ctx.scale(scale, scale);
		ctx.translate(-cx, -cy);
		
		this.child.draw(ctx, x, y, w, h, theme);
		ctx.restore();
	}
}

export class Shaker extends Widget {
	private trauma = 0;
	private rumble = 0;

	constructor(
		private child: Widget,
		private decayProvider: () => number = () => 30,
	) { super(); }

	trigger(intensity: number) { this.trauma += intensity; }
	setRumble(intensity: number) { this.rumble = intensity; }

	getMinSize(theme: GameTheme): Size {
		return this.child.getMinSize(theme);
	}

	update(dt: number): void {
		if (this.trauma > 0) this.trauma -= dt * this.decayProvider();
		else this.trauma = 0;
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: GameTheme): void {
		const current = Math.max(this.rumble, this.trauma);
		if (current <= 0) { this.child.draw(ctx, x, y, w, h, theme); return; } 

		const shakeX = (Math.random() - 0.5) * current;
		const shakeY = (Math.random() - 0.5) * current;

		ctx.save();
		ctx.translate(shakeX, shakeY);
		this.child.draw(ctx, x, y, w, h, theme);
		ctx.restore();
	}
}

export class Recoil extends Widget {
	private yPosition = 0;
	private yVelocity = 0;
	
	constructor(
		private child: Widget,
		private tensionProvider: () => number = () => 150,
		private dampingProvider: () => number = () => 20,
		private massProvider: () => number = () => 1,
	) { super(); }

	trigger(amount: number) { this.yVelocity += amount; }

	getMinSize(theme: GameTheme): Size {
	    return this.child.getMinSize(theme);
	}

	update(dt: number): void {
		const springForce = -this.tensionProvider() * this.yPosition;

		const dampingForce = -this.dampingProvider() * this.yVelocity;

		const acceleration = (springForce + dampingForce) / this.massProvider();

		this.yVelocity += acceleration * dt;
		this.yPosition += this.yVelocity * dt;

		if (Math.abs(this.yPosition) < 0.1 && Math.abs(this.yVelocity) < 0.1) {
			this.yPosition = 0;
			this.yVelocity = 0;
		}
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: GameTheme): void {
		if (this.yPosition == 0) { this.child.draw(ctx, x, y, w, h, theme); return; }
			
		ctx.save();
		ctx.translate(0, this.yPosition);
		this.child.draw(ctx, x, y, w, h, theme);
		ctx.restore();
	}
}
