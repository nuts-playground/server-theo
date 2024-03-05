import { Player, IGameCell } from "../../types";

export const checkGameOver = (
    marker: string,
    player: Player,
    gameData: IGameCell[][]
) => {
    const lineArray = [
        // 가로 3줄
        [gameData[0][0], gameData[0][1], gameData[0][2]],
        [gameData[1][0], gameData[1][1], gameData[1][2]],
        [gameData[2][0], gameData[2][1], gameData[2][2]],
        // 세로 3줄
        [gameData[0][0], gameData[1][0], gameData[2][0]],
        [gameData[0][1], gameData[1][1], gameData[2][1]],
        [gameData[0][2], gameData[1][2], gameData[2][2]],
        // 대각선 2줄
        [gameData[0][0], gameData[1][1], gameData[2][2]],
        [gameData[0][2], gameData[1][1], gameData[2][0]],
    ];
    for (let i = 0; i < lineArray.length; i++) {
        if (lineArray[i].every((item) => item.player === marker)) {
            return player.name;
        }
    }

    let cellArray = gameData.reduce(function (
        prev: IGameCell[],
        next: IGameCell[]
    ) {
        return prev.concat(next);
    });

    if (cellArray.every((cell: IGameCell) => cell.value)) {
        return "drow";
    }

    return "";
};
