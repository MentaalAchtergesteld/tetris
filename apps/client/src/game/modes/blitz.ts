import { Widget } from "../../ui/widget";
import { Label } from "../../ui/widgets/label";
import { SizedBox } from "../../ui/widgets/layout";
import { LocalMode } from "./local";

export class BlitzMode extends LocalMode {

	constructor() {
		super("down", 120);
	}

	protected getModeName(): string { return "blitz"; }

	protected getSidebarWidgets(): Widget[] {
		return [
			new Label(() => "time", "title", "right").setFill(true),
			new Label(() => this.timer.format(), "data", "right").setFill(true),
			new SizedBox(0, 16),
			new Label(() => "score", "title", "right").setFill(true),
			new Label(() => this.linesCleared.toString(), "data", "right").setFill(true),
		];
	}

	protected getResultLabel(): string { return `final score ${this.linesCleared}`; }

	protected onReset(): void {}

	protected onLineClear(lines: number): void {
		const currentLevel = Math.floor(this.linesCleared/10)+1;
		this.game.gravityMultiplier = Math.max(1, currentLevel*0.8);
	}

	protected checkWinCondition(): void {
		if (this.timer.time <= 0) this.finish(true);
	}
}
