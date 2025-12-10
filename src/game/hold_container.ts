import { Piece } from "../piece";

export class HoldContainer {
	public piece: Piece | null = null;
	public isLocked: boolean = false;

	public swap(currentPiece: Piece): Piece | null {
		if (this.isLocked) return null;

		const comingOut = this.piece;
		this.piece = currentPiece;
		this.isLocked = true;

		return comingOut;
	}

	public reset() {
		this.piece = null;
		this.isLocked = false;
	}

	public unlock() {
		this.isLocked = false;
	}
}
