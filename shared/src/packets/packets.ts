import { GameAction } from "../game/actions";
import { Piece } from "../game/piece";

export enum PacketType {
	JoinQueue    = "joinQueue",
	JoinRoom     = "joinRoom",
	PlayerJoined = "PlayerJoined",
	Seed         = "seed",
	Ready        = "ready",
	StartMatch   = "startMatch",
	Action       = "action",
	SelfState    = "selfState",
	OppState     = "oppState",
	GarbageIn    = "garbageIn",
	GarbageOut   = "garbageOut",
	EndMatch     = "endMatch",
	FinishMatch  = "finishMatch",
	LeaveRoom    = "leaveRoom,",

	// FUTURE
	ChatMessage = "chatMessage"
}

export interface ActionPayload {
	action: GameAction,
	data: number,
}

export interface StatePayload {
	id: string,
	grid: number[][],
	currentPiece: Piece | null,
}

export interface PlayerJoinedPayload {
	playerId: string,
}

export interface SeedPayload {
	seed: number,
}

export interface GarbagePayload {
	amount: number,
	receiverId: string,
	senderId: string,
}

export interface EndMatchPayload {
	winnerId: string,
}

export interface FinishMatchPayload {
	winnerId: string,
	selfPoints: number,
	opponentPoints: Map<string, number>,
}

type C2SPayloads = {
	[PacketType.JoinQueue]: null;
	[PacketType.Ready]: null,
	[PacketType.Action]: ActionPayload,
	[PacketType.LeaveRoom]: null,
}

type S2CPayloads = {
	[PacketType.JoinRoom]: null;
	[PacketType.PlayerJoined]: PlayerJoinedPayload;
	[PacketType.Seed]: SeedPayload,
	[PacketType.StartMatch]: null,
	[PacketType.Action]: ActionPayload,
	[PacketType.SelfState]: StatePayload,
	[PacketType.OppState]: StatePayload,
	[PacketType.GarbageIn]: GarbagePayload,
	[PacketType.GarbageOut]: GarbagePayload,
	[PacketType.EndMatch]: EndMatchPayload,
	[PacketType.FinishMatch]: FinishMatchPayload,
}

type AsSocketEvents<T> = {
	[K in keyof T]: T[K] extends void
		? () => void
		: (data: T[K]) => void;
};

export type C2SEvents = AsSocketEvents<C2SPayloads>; 
export type S2CEvents = AsSocketEvents<S2CPayloads>; 
