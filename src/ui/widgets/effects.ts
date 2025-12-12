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
