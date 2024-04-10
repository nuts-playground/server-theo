import http from "http";
import { Server, Socket } from "socket.io";
// import {
//     getRooms,
//     createRoom,
//     joinRoom,
//     exitRoom,
//     sendUpdatedRoom,
//     toggleReady,
//     startGame,
//     updateGameData,
// } from "./room";
import {
    createPlayer,
    getPlayers,
    deletePlayer,
    updateLocation,
    sendPlayers,
    registerUser,
    deleteUser,
} from "./player";
import { Player, PrismaClient } from "@prisma/client";
import { createChat } from "./chat";

interface UserSockets {
    [key: string]: string;
}
const userSockets: UserSockets = {};

const prisma = new PrismaClient();

async function main() {
    await prisma.user.deleteMany({});
    await prisma.room.deleteMany({});
    // await prisma.gameType.create({
    //     data: {
    //         name: "틱택토",
    //         minUsers: 2,
    //         maxUsers: 2,
    //     },
    // });
}

main();
const httpServer = http.createServer();

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

export const socketEvent = {
    SEND_ROOM: "sendRoom",
    SEND_ROOMS: "sendRooms",
    JOIN_ROOM: "joinRoom",
    UPDATE_GAME_DATA: "updateGameData",
    EXIT_ROOM: "exitRoom",
    SEND_PLAYERS: "sendPlayers",
    TOGGLE_READY: "toggleReady",
    START_GAME: "startGame",
    CHAT: "chat",
};

const updateUserList = async () => {
    const allUsers = await prisma.user.findMany();
    io.emit("userList", allUsers);
};

io.on("connection", async (socket) => {
    // 사용자 등록
    socket.on("registerUser", async ({ name }) => {
        const user = await registerUser(name);
        userSockets[user.id] = socket.id;
        socket.emit("registerUser", user);
        updateUserList();
    });

    // 사용자 제거
    socket.on("disconnect", async () => {
        const userId = Object.keys(userSockets).find(
            (key) => userSockets[key] === socket.id
        );
        if (userId) {
            await deleteUser(userId);
            delete userSockets[userId];
            updateUserList();
        }
    });

    socket.on("createGameRoom", () => {});

    sendPlayers(io);

    // socket.on("getRooms", async (name) => {
    //     socket.emit("sendRooms", await getRooms(name));
    // });

    // socket.on("createRoom", async ({ name, game }) => {
    //     const room = await createRoom({
    //         socket: socket.id,
    //         name,
    //         gameName: game.name,
    //     });
    //     const rooms = await getRooms(game.name);
    //     const players = await prisma.player.findMany({
    //         where: { location: game.name },
    //         select: { socket: true },
    //     });
    //     const sockets = players.map((player) => player.socket);
    //     socket.to(sockets).emit(socketEvent.SEND_ROOMS, rooms);
    //     socket.emit(socketEvent.SEND_ROOM, room);
    // });

    // socket.on(socketEvent.JOIN_ROOM, ({ id }) => {
    //     joinRoom({ id, socket });
    // });

    // socket.on(socketEvent.TOGGLE_READY, (id) => {
    //     toggleReady({ id, socket });
    // });

    // socket.on(socketEvent.UPDATE_GAME_DATA, (data, id) => {
    //     updateGameData({ data, id, socket });
    // });

    socket.on("disconnect", async () => {
        deletePlayer(io, socket);
    });

    // 채팅
    socket.on(
        socketEvent.CHAT,
        ({ text, name }: { text: string; name: string }) => {
            createChat({ text, name, io });
            console.log("채팅");
        }
    );
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`${PORT} 포트에서 socket.io 서버 실행중`);
});
