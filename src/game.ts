import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getGameName = async (id: string) => {
    const game = await prisma.game.findUnique({
        where: { id },
        select: { name: true },
    });

    return game?.name;
};
