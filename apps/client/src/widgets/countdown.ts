import { Conditional, Label, LabelStyle, Provider, resolve, Size, StyledWidget, TextAlign, Widget } from "@tetris/ui";
import { Easing, Opacity, Scale } from "./effects";

export class Countdown extends StyledWidget<LabelStyle> {
	private root: Widget;

	constructor(
		private time: Provider<number>,
		private labels: string[] = ["ready", "set", "go"],
	) {
		super({fontFamily: "Arial", fontWeight: "normal", fontSize: 24, color: "#fff", textAlign: TextAlign.Center});
		this.root = this.build();
		this.labels = this.labels.reverse();
	}

	protected onStyleChange(): void {
	  this.root = this.build();
	}

	private getScale(): number {
		const t = resolve(this.time);
		let progress = 1 - (t % 1);
		progress = Math.min(1, progress * 2);

		return Easing.easeOutSpring(progress);
	}

	private getOpacity(): number {
		const t = resolve(this.time);

		if (t > .5) return 1;
		else return Math.max(0,  t*2);
	}

	private getText(): string {
		const t = resolve(this.time);
		const seconds = Math.floor(t);

		if (seconds > this.labels.length) return seconds.toString();
		else return this.labels[seconds];

	}

	private build(): Widget {
		return new Conditional(
			() => resolve(this.time) >= 0,
			new Opacity(() => this.getOpacity(), new Scale(() => this.getScale(),
				new Label(
					() => this.getText(),
				).withStyle(this.style),
			))
		);
	}

	getMinSize(): Size {
		return this.root.getMinSize();
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
		this.root.draw(ctx, x, y, w, h);
	}
}
