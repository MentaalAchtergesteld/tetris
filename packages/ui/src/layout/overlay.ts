import { Size } from "../core/types";
import { Widget } from "../core/widget";

export class Overlay extends Widget{
	constructor(
		private children: Widget[] = []
	) { super(); }

	getMinSize(): Size {
		return this.children.reduce(
			(maxSize, child) => {
				const childSize = child.getMinSize();
				return {
					width: Math.max(maxSize.width, childSize.width),
					height: Math.max(maxSize.height, childSize.height),
				}
			},
			{ width: 0, height: 0 },
		) 
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
		this.children.forEach(c => c.draw(ctx, x, y, w, h));
	}
}
