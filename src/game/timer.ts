export class GameTimer {
	public time: number = 0;
	private running: boolean = false;

	start() { this.running = true }
	stop() { this.running = false }
	reset() { this.time = 0; this.running = false; }

	update(dt: number) {
		if (!this.running) return;
		this.time += dt;
	}

	format(): string {
		const m = Math.floor(this.time/60).toString().padStart(2, '0');
		const s = Math.floor(this.time % 60).toString().padStart(2, '0');
		const ms = Math.floor((this.time%1) * 100).toString().padStart(2, '0');
		return `${m}:${s}.${ms}`;
	}
}
