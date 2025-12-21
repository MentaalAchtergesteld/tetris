import { Size } from "../core/types";
import { StyledWidget } from "../core/widget";

export interface PanelStyle {
	backgroundColor: string;
	borderColor: string;
	borderWidth: number;
	cornerRadius: number;
	shadowColor: string;
	shadowBlur: number;
}

const DEFAULT_PANEL_STYLE: PanelStyle = {
	backgroundColor: "#333",
	borderColor: "transparent",
	borderWidth: 0,
	cornerRadius: 0,
	shadowColor: "transparent",
	shadowBlur: 0
};

export class Panel extends StyledWidget<PanelStyle> {
	constructor() { super(DEFAULT_PANEL_STYLE) }

	getMinSize(): Size {
	    return { width: 0, height: 0 };
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
		const s = this.style;

		ctx.save();
		
		if (s.shadowBlur > 0) {
			ctx.shadowColor = s.shadowColor;
			ctx.shadowBlur = s.shadowBlur;
			ctx.shadowOffsetY = 2;
		}

		ctx.beginPath();
		if (ctx.roundRect) {
			ctx.roundRect(x, y, w, h, s.cornerRadius);
		} else {
			ctx.rect(x, y, w, h);
		}

		ctx.fillStyle = s.backgroundColor;
		ctx.fill();

		ctx.shadowColor = "transparent";
		if (s.borderWidth > 0) {
			ctx.lineWidth = s.borderWidth;
			ctx.strokeStyle = s.borderColor;
			ctx.stroke();
		}

		ctx.restore();
	}
}
