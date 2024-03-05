import { Room, Rooms, Players } from "../types";

export const sendRoom = (room: Room, socket: any) => {
    if (!room.players) return;

    const playerIds = Object.keys(room.players);
    playerIds.forEach((id: string) => socket.to(id).emit("sendRoom", room));
    socket.emit("sendRoom", room);
};

export const sendRooms = (rooms: Rooms, connectedId: string[], socket: any) => {
    connectedId.forEach((id) => socket.to(id).emit("sendRooms", rooms));
    socket.emit("sendRooms", rooms);
};
