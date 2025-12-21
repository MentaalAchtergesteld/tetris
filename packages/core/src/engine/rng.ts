export class RNG {
	private state: number;

	constructor(seed: number = Math.random()) { this.state = seed };

	public setSeed(seed: number) { this.state = seed }

	public nextFloat(): number {
		let t = (this.state += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	public nextFloatRange(min: number, max: number): number {
		return this.nextFloat() * (max-min) + min;
	}

	public nextInt(): number {
		return Math.floor(this.nextFloat());
	}

	public nextIntRange(min: number, max: number): number {
		return Math.floor(this.nextFloat() * (max-min)) + min;
	}

	public shuffleArray<T>(array: T[]): T[] {
		for (let i = array.length-1; i > 0; i--) {
			const j = this.nextIntRange(0, i+1);
			[array[i], array[j]] = [array[j], array[i]];;
		}
		return array;
	}
}
