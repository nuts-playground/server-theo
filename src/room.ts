import { Game, Room, Rooms } from "../types";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const sendRoom = (room: Room, socket: any) => {
    if (!room.players) return;

    const playerIds = Object.keys(room.players);
    playerIds.forEach((id: string) => socket.to(id).emit("sendRoom", room));
    socket.emit("sendRoom", room);
};

export const createRoom = async (name: string, gameName: string) => {
    const gameId = await prisma.game
        .findFirst({ where: { name: gameName } })
        .then((game) => game?.id);

    if (!gameId) throw new Error(`${gameName} 데이터를 찾을 수 없습니다.`);

    const room = prisma.room.create({ data: { name, gameId, data: {} } });
    return room;
};

export const getRooms = async () => {
    const rooms = await prisma.room.findMany();
    return rooms;
};

export const sendRooms = async (sockets: any) => {
    const rooms = await getRooms();
    sockets.emit("sendRooms", rooms);
};
