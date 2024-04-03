import { PrismaClient } from "@prisma/client";
import { Server, Socket } from "socket.io";
import { socketEvent } from ".";

const prisma = new PrismaClient();

export const createPlayer = async ({
    socket,
    name,
    location,
}: {
    socket: string;
    name: string;
    location: string;
}) => {
    const findPlayer = await prisma.player.findFirst({ where: { socket } });
    const player = findPlayer
        ? null
        : await prisma.player.create({ data: { socket, name, location: "" } });

    return player;
};

export const deletePlayer = async (io: Server, socket: Socket) => {
    const player = await prisma.player.findUnique({
        where: { socket: socket.id },
    });
    if (player) await prisma.player.delete({ where: { socket: socket.id } });
    sendPlayers(io);
};

export const getPlayers = async () => {
    return await prisma.player.findMany();
};

export const sendPlayers = async (io: Server) => {
    console.log("sendplayer");
    io.sockets.emit(socketEvent.SEND_PLAYERS, await getPlayers());
};

export const updateLocation = async (
    io: Server,
    socket: Socket,
    location: string
) => {
    await prisma.player.update({
        where: { socket: socket.id },
        data: { location },
    });

    sendPlayers(io);
};
