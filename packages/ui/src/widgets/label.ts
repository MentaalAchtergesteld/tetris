import "../../extensions/canvas";
import { GameTheme } from "../../theme";
import { Size, Widget } from "../widget";
import { measureText } from "../util";

export type LabelStyle = "title" | "data";

export class Label extends Widget {
	private textProvider: () => string;
	private style: LabelStyle;
	private align: CanvasTextAlign;

	constructor(textProvider: () => string, style: LabelStyle = "data", align: CanvasTextAlign = "left") {
		super();
		this.textProvider = textProvider;
		this.style = style;
		this.align = align;
	}

	private getStyleInfo(theme: GameTheme) {
		switch (this.style) {
			case "title": return {
				fontFamily: theme.Typography.TitleFontFamily,
				fontSize: theme.Typography.TitleFontSize,
				color: theme.Colors.TextPrimary,
			};
			case "data": return {
				fontFamily: theme.Typography.DataFontFamily,
				fontSize: theme.Typography.DataFontSize,
				color: theme.Colors.TextSecondary,
			};
		}
	}

	getMinSize(theme: GameTheme): Size {
		const text = this.textProvider();
		const styleInfo = this.getStyleInfo(theme);

		const { width, height } = measureText(text, styleInfo.fontFamily, styleInfo.fontSize);
		return { width, height } 
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: GameTheme): void {
		const text = this.textProvider();
		const styleInfo = this.getStyleInfo(theme);

		ctx.fillStyle = styleInfo.color;
		ctx.font = `${styleInfo.fontSize}px ${styleInfo.fontFamily}`;

		ctx.textBaseline = "top";

		let drawX = x;

		switch (this.align) {
			case "center":
				drawX = x + (w / 2);
				ctx.textAlign = "center";
				break;
			case "right":
				drawX = x + w;
				ctx.textAlign = "right";
				break;
			default:
				drawX = x;
				ctx.textAlign = "left";
				break;
		}

		ctx.fillText(text, drawX, y);
	}
}
