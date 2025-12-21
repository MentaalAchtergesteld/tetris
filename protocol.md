# Multiplayer Protocol

## Matchmaking & Room Management

1. JoinQueue    (C->S) { } User joins the queue to find a game
2. JoinRoom     (S->C) { roomId: string, opponent?: PlayerData } User gets placed in a room, contains opponent data if there is one
3. PlayerJoined (S->C) { player: PlayerData } Another user enters the room 
4. PlayerLeft   (S->C) { playerId: string, reason: string } Other user disconnects or leaves
5. LeaveRoom    (C->)  { } User leaves room/queue

# Lobby & Setup

1. Ready       (C->S) { state: boolean } User toggles "ready" state
2. PlayerReady (S->C) { playerId: string, state: boolean } Opponent gets ready
3. StartMatch  (S->C) { seed: number, round: number } Starts the match and initializes RNG with the seed

## Gameplay

1. Action     (C->S) { action: GameAction } Sends current player action to server
2. Action     (S->C) { playerId: string, action: GameAction } Server relays opponent action to other players
3. SelfState  (S->C) { grid: number\[]\[], piece: Piece } Server sends users own state, to correct cheats/desyncs
4. OppState   (S->C) { grid: number\[]\[], piece: Piece } Server sends opponents state, to correct cheats/desyncs
5. GarbageIn  (S->C) { senderId: string, amount: number } User receives garbage lines
6. GarbageOut (S->C) { receiverId: string, amount: number } User sends garbage lines

## Game End & Results

1. MatchEnd    (S->C) { winnerId: string, reason: string } Sent when a single match ends
2. FinishMatch (S->C) { winnerId: string, scores: { (id): number } } End the full game, with scores
