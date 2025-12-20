import { GameTheme } from "../../theme";
import { Size, Widget } from "../widget";
import { Easing, Opacity, Scale } from "./effects";
import { Label } from "./label";
import { Conditional } from "./logic";

export class Countdown extends Widget {
	private root: Widget;

	constructor(
		private timerProvider: () => number,
		private labels: string[] = ["ready", "set", "go"],
	) {
		super();
		this.root = this.build();
		this.labels = this.labels.reverse();
	}

	private getScale(): number {
		const t = this.timerProvider();
		let progress = 1 - (t % 1);
		progress = Math.min(1, progress * 2);

		return Easing.easeOutSpring(progress);
	}

	private getOpacity(): number {
		const t = this.timerProvider();

		if (t > .5) return 1;
		else return Math.max(0,  t*2);
	}

	private getText(): string {
		const t = this.timerProvider();
		const seconds = Math.floor(t);

		if (seconds > this.labels.length) return seconds.toString();
		else return this.labels[seconds];

	}

	private build(): Widget {
		return new Conditional(
			() => this.timerProvider() >= 0,
			new Opacity(() => this.getOpacity(), new Scale(() => this.getScale(),
				new Label(
					() => this.getText(),
					"title",
					"center"
				),
			))
		);
	}

	getMinSize(theme: GameTheme): Size {
		return this.root.getMinSize(theme);
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: GameTheme): void {
		this.root.draw(ctx, x, y, w, h, theme);
	}
}
