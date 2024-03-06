import { Room, Rooms } from "../types";

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

export const exitRoom = (
    room: Room,
    rooms: Rooms,
    connectedId: string[],
    socket: any
) => {
    if (!room.id) return false;
    delete room.players[socket.id];
    if (!Object.keys(room.players).length) {
        const roomIndex = rooms[room.game.name].findIndex(
            (item) => item.id === room.id
        );
        rooms[room.game.name].splice(roomIndex);
        room = {
            id: 0,
        } as Room;
        sendRoom(room, socket);
        sendRooms(rooms, connectedId, socket);
    } else {
        sendRoom(room, socket);
        room = {
            id: 0,
        } as Room;
        sendRoom(room, socket);
    }
};
