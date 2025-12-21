import { Size } from "../core/types";
import { Widget } from "../core/widget";

export class Margin extends Widget {
	constructor(private child: Widget, private margin: number) {
		super();
	}

	getMinSize(): Size {
		const size = this.child.getMinSize();
		return {
			width: size.width+this.margin*2,
			height: size.height+this.margin*2,
		}
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
		this.child.draw(ctx, x+this.margin, y+this.margin, w, h); 
	}
}
