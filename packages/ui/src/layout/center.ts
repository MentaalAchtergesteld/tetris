import { Size } from "../core/types";
import { Widget } from "../core/widget";

export class Center extends Widget {
	constructor(private child: Widget) {
		super();
	}

	getMinSize(): Size {
		return this.child.getMinSize();
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
		const childSize = this.child.getMinSize(); 

		const centerX = x + (w-childSize.width)/2;
		const centerY = y + (h-childSize.height)/2;

		this.child.draw(ctx, centerX, centerY, childSize.width, childSize.height);
	}
}
