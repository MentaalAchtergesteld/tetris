import { Label, SizedBox, TextAlign, Widget } from "@tetris/ui";
import { LocalMode } from "./local";
import { activeTheme } from "../../theme";

export class BlitzMode extends LocalMode {

	constructor() {
		super("down", 120);
	}

	protected getModeName(): string { return "blitz"; }

	protected getSidebarWidgets(): Widget[] {
		return [
			new Label(() => "time")
				.withStyle(activeTheme.typography.title)
				.setTextAlign(TextAlign.Right)
				.setFill(true),
			new Label(() => this.timer.format())
				.withStyle(activeTheme.typography.data)
				.setTextAlign(TextAlign.Right)
				.setFill(true),
			new SizedBox(0, 16),
			new Label(() => "score")
				.withStyle(activeTheme.typography.title)
				.setTextAlign(TextAlign.Right)
				.setFill(true),
			new Label(() => this.linesCleared.toString())
				.withStyle(activeTheme.typography.data)
				.setTextAlign(TextAlign.Right)
				.setFill(true),
		];
	}

	protected getResultLabel(): string { return `final score ${this.linesCleared}`; }

	protected onReset(): void {}

	protected onLineClear(_: number): void {
		const currentLevel = Math.floor(this.linesCleared/10)+1;
		this.game.gravityMultiplier = Math.max(1, currentLevel*0.8);
	}

	protected checkWinCondition(): void {
		if (this.timer.time <= 0) this.finish(true);
	}
}
