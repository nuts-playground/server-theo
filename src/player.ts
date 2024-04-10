import { PrismaClient } from "@prisma/client";
import { Server, Socket } from "socket.io";
import { socketEvent } from ".";

const prisma = new PrismaClient();

export const registerUser = async (name: string) => {
    try {
        return await prisma.user.create({ data: { name } });
    } catch (error) {
        console.error("Error registerUser:", error);
        throw error;
    }
};

export const deleteUser = async (userId: string) => {
    await prisma.user.delete({ where: { id: userId } });
};

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

export const findPlayer = async (socketId: string) => {
    try {
        const player = await prisma.player.findUnique({
            where: {
                socket: socketId,
            },
        });
        return player;
    } catch (error) {
        console.error("Error findPlayer():", error);
        throw error;
    }
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
