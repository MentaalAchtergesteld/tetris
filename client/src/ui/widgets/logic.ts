import { GameTheme } from "../../theme";
import { Size, Widget } from "../widget";

export class Conditional extends Widget {
	condition: () => boolean;
	child: Widget;

	constructor(condition: () => boolean, child: Widget) {
		super();
		this.condition = condition;
		this.child = child;
	}

	getMinSize(theme: GameTheme): Size {
		if (!this.condition()) return { width: 0, height: 0 };
		return this.child.getMinSize(theme);
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: GameTheme): void {
		if (!this.condition()) return;
		this.child.draw(ctx, x, y, w, h, theme);
	}
}

export class Switch extends Widget {
	condition: () => boolean;
	childFalse: Widget;
	childTrue: Widget;

	constructor(condition: () => boolean, childTrue: Widget, childFalse: Widget) {
		super();
		this.condition = condition;
		this.childFalse = childFalse;
		this.childTrue = childTrue;
	}

	getMinSize(theme: GameTheme): Size {
		if (this.condition()) return this.childTrue.getMinSize(theme);
		else return this.childFalse.getMinSize(theme);
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: GameTheme): void {
		if (this.condition()) this.childTrue.draw(ctx, x, y, w, h, theme);
		else this.childFalse.draw(ctx, x, y, w, h, theme);
	}
}
