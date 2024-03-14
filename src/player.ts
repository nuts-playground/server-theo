import { PrismaClient } from "@prisma/client";

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
        : await prisma.player.create({ data: { socket, name, location } });

    return player;
};

export const deletePlayer = async (socket: string) => {
    const player = await prisma.player.findUnique({ where: { socket } });
    if (player) await prisma.player.delete({ where: { socket } });
};

export const getPlayers = async () => {
    return await prisma.player.findMany();
};

export const updateLocation = async (socket: string, location: string) => {
    await prisma.player.update({ where: { socket }, data: { location } });
};
