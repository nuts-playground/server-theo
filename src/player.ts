import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const sendPlayers = async (sockets: any) => {
    const players = await getPlayers();
    sockets.emit("sendPlayers", players);
};

export const createPlayer = async (socket: string, name: string) => {
    const findPlayer = await prisma.player.findFirst({ where: { socket } });
    const player = findPlayer
        ? null
        : await prisma.player.create({ data: { socket, name } });

    return player;
};

export const deletePlayer = async (socket: string) => {
    await prisma.player.delete({ where: { socket } });
};

export const getPlayers = async () => {
    const players = await prisma.player.findMany();
    return players;
};
