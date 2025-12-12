import { Color, GameTheme } from "../../theme";
import { Size, Widget } from "../widget";

export class ColorBlock extends Widget {
	constructor(private color: Color) { super(); }

	getMinSize(theme: GameTheme): Size {
	    return { width: 0, height: 0 }
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: GameTheme): void {
		ctx.fillStyle = this.color;
		ctx.fillRect(x, y, w, h);
	}
}
