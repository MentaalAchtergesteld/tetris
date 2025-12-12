import { TetrominoType } from "./piece";

function createPieceBag(): TetrominoType[] {
	const bag: TetrominoType[] = ["I", "J", "L", "O", "S", "T", "Z"];
	for (let i = bag.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[bag[i], bag[j]] = [bag[j], bag[i]];
	}
	return bag;
}

export class PieceQueue {
	private queue: TetrominoType[];
	private readonly MIN_LENGTH = 7;

	private refill() {
		while (this.queue.length < this.MIN_LENGTH) {
			this.queue.push(...createPieceBag())
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
