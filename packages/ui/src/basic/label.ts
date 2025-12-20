import { Size } from "../core/types";
import { Widget } from "../core/widget";
import { BaseTheme, TextStyle } from "../theme";
import { measureText } from "../util";

export enum TextAlign {
	Left, Center, Right
};

export class Label<Theme extends BaseTheme = BaseTheme> extends Widget {
	private overrides: Partial<TextStyle> = {};

	constructor(
		private text: string,
		private variant: string = "default",
		private textAlign: TextAlign = TextAlign.Left,
	) { super(); }

	public setColor(color: string): this { this.overrides.color    = color; return this; };
	public setSize(size: number): this { this.overrides.fontSize = size; return this; };
	public setWeight(weight: number): this { this.overrides.fontWeight = weight; return this; };
	public setText(text: string): this { this.text = text; return this; };

	private getComputedStyle(theme: Theme): TextStyle {
		const themeStyle = theme.typography[this.variant] || theme.typography.default;

		return { ...themeStyle, ...this.overrides };
	}

	getMinSize(theme: Theme): Size {
		const style = this.getComputedStyle(theme);
		const size = measureText(this.text, style.fontFamily, style.fontSize, style.fontWeight);

		return {
			width: size.width,
			height: style.fontSize,
		}
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: Theme): void {
	  const style = this.getComputedStyle(theme);

		ctx.save();
		ctx.font = `${style.fontWeight || "normal"} ${style.fontSize}px ${style.fontFamily}`;
		ctx.fillStyle = style.color || "#fff";

		let drawX = x;
		switch (this.textAlign) {
			case TextAlign.Left:
				ctx.textAlign = "left";
				break;
			case TextAlign.Center:
				drawX = x + (w/2);
				ctx.textAlign = "center";
				break;
			case TextAlign.Right:
				drawX = x + w;
				ctx.textAlign = "right";
				break;
		}

		ctx.textBaseline = "middle";
		ctx.fillText(this.text, drawX, y + (h/2));
		ctx.restore();
	}
}
