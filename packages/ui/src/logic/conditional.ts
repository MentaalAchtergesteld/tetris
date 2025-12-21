import { Size } from "../core/types";
import { Widget } from "../core/widget";

export class Conditional extends Widget {
	constructor(
		private child: Widget,
		private condition: () => boolean,
	) { super(); }

	getMinSize(): Size {
		return this.child.getMinSize();
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
	  if (!this.condition()) return;
		this.child.draw(ctx, x, y, w, h);
	}
}
