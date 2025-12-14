import { RNG } from "../engine/rng";
import { TetrominoType } from "./piece";

export class PieceQueue {
	private readonly rng: RNG;
	private readonly MIN_LENGTH = 7;

	private queue: TetrominoType[];

	constructor(rng: RNG) {
		this.rng = rng;
	}

	private refill() {
		const bag: TetrominoType[] = ["I", "J", "L", "O", "S", "T", "Z"];
		while (this.queue.length < this.MIN_LENGTH) {
			this.queue.push(...this.rng.shuffleArray(bag))
		}
	}

	public getNext(): TetrominoType {
		const next = this.queue.shift();
		this.refill();
		if (!next) throw Error("Queue Empty!");
		return next;
	}

	public reset() {
		this.queue = [];
		this.refill();
	}
	
	public peek(count: number): TetrominoType[] {
		return this.queue.slice(0, count);
	}
}
