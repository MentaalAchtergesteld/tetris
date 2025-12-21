import { Size } from "../core/types";
import { Widget } from "../core/widget";

export class Switch extends Widget {
	constructor(
		private condition: () => number,
		private children: Widget[],
	) { super(); }

	getActiveChild(): Widget {
		return this.children[this.condition() % this.children.length];
	}

	getMinSize(): Size {
		const child = this.getActiveChild(); 
		return child.getMinSize();
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
		const child = this.getActiveChild();
		child.draw(ctx, x, y, w, h);
	}
}
