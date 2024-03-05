import { Player } from "../types";

export const sendPlayers = (
    connectedId: string[],
    players: Player[],
    socket: any
) => {
    connectedId.forEach((id) => socket.to(id).emit("sendPlayers", players));
    socket.emit("sendPlayers", players);
};
