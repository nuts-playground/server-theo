export interface IGameCell {
    player: string;
    value: boolean;
}

export interface Player {
    [key: string]: string | boolean;
    id: string;
    name: string;
    isReady: boolean;
    location: "로비" | "";
}

export interface Players {
    [key: string]: Player;
}

export type GameData = IGameCell[][] | GuessingData;

export interface Game {
    name: string;
    maxPlayers: number;
    minPlayers: number;
}

export interface Room {
    [key: string]: string | number | object | boolean;
    id: number;
    name: string;
    game: Game;
    players: Players;
    isStart: boolean;
    gameData: GameData;
    currentTurn: string;
    winner: string;
    master: string;
}

export interface TictactoeRoom extends Room {
    gameData: IGameCell[][];
}

export interface GuessingData {
    answer: string;
    history: [
        {
            question: string;
            answer: boolean | null;
        }
    ];
    state: "question" | "answer" | "init" | "over";
}

export interface GuessingRoom extends Room {
    gameData: GuessingData;
}

export interface Rooms {
    [key: string]: Room[];
}
