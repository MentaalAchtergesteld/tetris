export class GameTimer {
	public time: number = 0;
	private running: boolean = false;
	private direction: "up" | "down";
	private startValue = 0;

	constructor(direction: "up" | "down" = "up", startValue: number = 0) {
		this.direction = direction;
		this.startValue = startValue;
		this.reset();
	}

	start() { this.running = true }
	stop() { this.running = false }
	reset() { this.time = this.startValue; this.running = false; }

	update(dt: number) {
		if (!this.running) return;

		if (this.direction == "up") this.time += dt;
		else this.time -= dt;
	}

	format(): string {
		const m = Math.floor(this.time/60).toString().padStart(2, '0');
		const s = Math.floor(this.time % 60).toString().padStart(2, '0');
		const ms = Math.floor((this.time%1) * 100).toString().padStart(2, '0');
		return `${m}:${s}.${ms}`;
	}
}
