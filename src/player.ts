import { Player } from "../types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const sendPlayers = (
    connectedId: string[],
    players: Player[],
    socket: any
) => {
    connectedId.forEach((id) => socket.to(id).emit("sendPlayers", players));
    socket.emit("sendPlayers", players);
};

export const createPlayer = async (name: string) => {
    const findPlayer = await prisma.player.findFirst({ where: { name } });
    const player = findPlayer
        ? null
        : await prisma.player.create({ data: { name } });

    return player;
};

export const deletePlayer = async (name: string) => {
    await prisma.player.delete({ where: { name } });
};

export const getPlayers = async () => {
    const players = await prisma.player.findMany();
    return players;
};
