import { Size } from "../core/types";
import { Widget } from "../core/widget";
import { BaseTheme } from "../theme";

export class Center extends Widget {
	constructor(private child: Widget) {
		super();
	}

	getMinSize(theme: BaseTheme): Size {
	    return this.child.getMinSize(theme);
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: BaseTheme): void {
		const childSize = this.child.getMinSize(theme); 

		const centerX = x + (w-childSize.width)/2;
		const centerY = y + (h-childSize.height)/2;

		this.child.draw(ctx, centerX, centerY, w, h, theme);
	}
}
