import { Socket } from "socket.io";
import { socketEvent } from "./index";
import { Player, PrismaClient, Room } from "@prisma/client";
import { getGameName } from "./game";
import _ from "underscore";
import { RoomPlayer } from "../types";
const prisma = new PrismaClient();

// 새로운 게임 방 생성
export const createGameRoom = async (roomname: string, gameTypeId: string) => {
    try {
        return await prisma.gameRoom.create({
            data: {
                name: roomname,
                gameType: { connect: { id: gameTypeId } },
            },
        });
    } catch (error) {
        console.error("Error createGameRoom:", error);
        throw error;
    }
};

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
            state: "waiting",
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
    socket: Socket;
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
        where: { socket: socket.id },
    });

    let state: Gender;
    if (room.players.length === game.maxPeople - 1) {
        state = "full";
    } else if (room.players.length >= game.minPeople - 1) {
        state = "canStart";
    } else {
        state = "waiting";
    }

    const joinedRoom = await prisma.room.update({
        where: { id },
        data: {
            state,
            players: {
                push: { ...player, ready: false, isMaster: false },
            },
        },
    });

    sendUpdatedRoom(joinedRoom, socket);
};

export const exitRoom = async (id: string, socket: string) => {
    const room = await prisma.room.findUnique({ where: { id } });
    if (room) {
        const players = room.players.filter(
            (player) => player.socket !== socket
        );

        if (players.length === 0) {
            await prisma.room.delete({ where: { id } });
        } else {
            const updatedRoom = await prisma.room.update({
                where: { id },
                data: { players: { set: players } },
            });
            // sendUpdatedRoom(updatedRoom, socket);
        }
    }
};

export const getRooms = async (gameName: string) => {
    const game = await prisma.game.findFirst({ where: { name: gameName } });
    const rooms = await prisma.room.findMany({
        where: { gameId: game?.id },
    });
    return rooms;
};

export const sendRooms = async (game: string, socket: Socket) => {
    const players = await prisma.player.findMany({ where: { location: game } });
    const sockets = players.map((player) => player.socket);
    const rooms = await getRooms(game);
    socket.to(sockets).emit(socketEvent.SEND_ROOMS, rooms);
    socket.emit(socketEvent.SEND_ROOMS, rooms);
};

export const sendUpdatedRoom = async (room: Room, socket: Socket) => {
    const gameName = await getGameName(room.gameId);
    if (gameName) sendRooms(gameName, socket);

    const sockets = (room.players as Player[]).map(
        (player: Player) => player.socket
    );
    socket.to(sockets).emit(socketEvent.SEND_ROOM, room);
    socket.emit(socketEvent.SEND_ROOM, room);
};

export const toggleReady = async ({
    id,
    socket,
}: {
    id: string;
    socket: Socket;
}) => {
    const room = await prisma.room.findUnique({
        where: { id },
        select: { players: true },
    });
    const players = room?.players as unknown as RoomPlayer[];
    const index = _.findIndex(players, (player) => player.socket == socket.id);

    players[index].ready = !players[index].ready;

    const updatedRoom = await prisma.room.update({
        where: { id },
        data: { players: { set: JSON.parse(JSON.stringify(players)) } },
    });

    sendUpdatedRoom(updatedRoom, socket);
};

export const startGame = async ({
    data,
    id,
    socket,
}: {
    data: any;
    id: string;
    socket: Socket;
}) => {
    const updatedRoom = await prisma.room.update({
        where: { id },
        data: { state: "playing", data },
    });
    sendUpdatedRoom(updatedRoom, socket);
};

export const updateGameData = async ({
    data,
    id,
    socket,
}: {
    data: any;
    id: string;
    socket: Socket;
}) => {
    const updatedRoom = await prisma.room.update({
        where: { id },
        data: { data },
    });
    sendUpdatedRoom(updatedRoom, socket);
};
