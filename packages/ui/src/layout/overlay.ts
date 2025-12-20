import { Container } from "../core/container";
import { Size } from "../core/types";
import { Widget } from "../core/widget";
import { BaseTheme } from "../theme";

export class Overlay extends Container {
	constructor(children: Widget[] = []) {
		super(children);
	}

	getMinSize(theme: BaseTheme): Size {
		return this.children.reduce(
			(maxSize, child) => {
				const childSize = child.getMinSize(theme);
				return {
					width: Math.max(maxSize.width, childSize.width),
					height: Math.max(maxSize.height, childSize.height),
				}
			},
			{ width: 0, height: 0 },
		) 
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: BaseTheme): void {
		this.children.forEach(c => c.draw(ctx, x, y, w, h, theme));
	}
}
