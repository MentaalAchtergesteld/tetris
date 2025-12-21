import { Shaker } from "../widgets/effects";
import { Game } from "@tetris/shared";

export class DangerLevel {
	private rawLevel = 0;
	private smoothLevel = 0;

	constructor(
		private game: Game,
		private shaker: Shaker,
		private threshold: number = 0.7,
		private rumbleIntensity: number = 1.0,
		private increaseSpeed: number = 10.0,
		private decreaseSpeed: number = 4.0,
	) {}

	public getLevel() { return this.smoothLevel }

  private calculateDangerLevel(): number {
		const visibleHeight = this.game.getVisibleHeight();
		const currentHeight = this.game.getOccupiedHeight();

		const ratio = currentHeight / visibleHeight;
		
		if (ratio < this.threshold) return 0;
		else return (ratio - this.threshold) / (1 - this.threshold)
	}

	reset() {
		this.rawLevel = 0;
		this.smoothLevel = 0;
	}

	update(dt: number) {
		this.rawLevel = this.calculateDangerLevel();

		const speed = this.rawLevel > this.smoothLevel ? this.increaseSpeed : this.decreaseSpeed;
		const diff = this.rawLevel - this.smoothLevel;

		if (Math.abs(diff) > 0.001) {
			this.smoothLevel += diff * speed * dt;
		} else {
			this.smoothLevel = this.rawLevel;
		}
		this.shaker.setRumble(this.smoothLevel*this.rumbleIntensity);
	}
}
