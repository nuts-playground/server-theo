import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createRoom = async ({
    socket,
    name,
    gameName,
}: {
    socket: string;
    name: string;
    gameName: string;
}) => {
    const gameId = await prisma.game
        .findFirst({ where: { name: gameName } })
        .then((game) => game?.id);

    const player = await prisma.player.findUnique({
        where: { socket },
        select: { id: true, name: true, socket: true },
    });

    if (!gameId) throw new Error(`${gameName} 데이터를 찾을 수 없습니다.`);

    const room = prisma.room.create({
        data: {
            name,
            gameId,
            players: [{ ...player, ready: false, isMaster: true }],
            data: {},
        },
    });
    return room;
};

export const joinRoom = async ({
    id,
    socket,
}: {
    id: string;
    socket: string;
}) => {
    const room = await prisma.room.findUnique({
        where: { id },
        select: { players: true, gameId: true },
    });
    if (!room) throw new Error("없는 방입니다.");

    const game = await prisma.game.findUnique({ where: { id: room.gameId } });
    if (!game) throw new Error("없는 게임입니다.");
    if (game.maxPeople === room.players.length) return false;

    const player = await prisma.player.findUnique({
        where: { socket },
    });

    return await prisma.room.update({
        where: { id },
        data: {
            players: {
                push: { ...player, ready: false, isMaster: false },
            },
        },
    });
};

export const getRooms = async (gameName: string) => {
    const game = await prisma.game.findFirst({ where: { name: gameName } });
    const rooms = await prisma.room.findMany({
        where: { gameId: game?.id },
    });
    return rooms;
};
