import http from "http";
import { Server, Socket } from "socket.io";
import { checkGameOver } from "./tictactoe/tictactoe";
import {
    getRooms,
    createRoom,
    joinRoom,
    exitRoom,
    sendUpdatedRoom,
} from "./room";
import {
    createPlayer,
    getPlayers,
    deletePlayer,
    updateLocation,
    sendPlayers,
} from "./player";
import { Player, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // await prisma.player.create({
    //     data: {
    //         name: "Thoe",
    //     },
    // });
    await prisma.player.deleteMany({});
    await prisma.room.deleteMany({});
    // await prisma.game.create({
    //     data: {
    //         name: "틱택토",
    //         minPeople: 2,
    //         maxPeople: 2,
    //     },
    // });
    // await prisma.room.deleteMany();
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
    EXIT_ROOM: "exitRoom",
    SEND_PLAYERS: "sendPlayers",
};

io.on("connection", async (socket) => {
    const players = await getPlayers();

    sendPlayers(io);
    socket.on("joinPlayground", async ({ name, location }) => {
        const player = await createPlayer({
            socket: socket.id,
            name,
            location,
        });
        socket.emit("joinPlayground", player);
        sendPlayers(io);
    });

    socket.on("updateLocation", (location: string) => {
        updateLocation(io, socket, location);
    });

    socket.on("getRooms", async (name) => {
        socket.emit("sendRooms", await getRooms(name));
    });

    socket.on("createRoom", async ({ name, game }) => {
        const room = await createRoom({
            socket: socket.id,
            name,
            gameName: game.name,
        });
        const rooms = await getRooms(game.name);
        const players = await prisma.player.findMany({
            where: { location: game.name },
            select: { socket: true },
        });
        const sockets = players.map((player) => player.socket);
        socket.to(sockets).emit(socketEvent.SEND_ROOMS, rooms);
        socket.emit(socketEvent.SEND_ROOM, room);
    });

    socket.on("joinRoom", ({ id }) => {
        joinRoom({ id, socket });
    });

    socket.on(socketEvent.EXIT_ROOM, async (id) => {
        const room = await exitRoom(id, socket.id);
        if (room) {
            const sockets = room.players.map((player) => {
                if (typeof player === "object" && player !== null) {
                    return (player as Player).socket;
                }
            }) as string[];
            socket.emit(socketEvent.SEND_ROOM, {});
            socket.to(sockets).emit(socketEvent.SEND_ROOM, room);
        }
    });

    // socket.on("turnEnd", (data) => {
    //     if (
    //         data.room.gameData[data.y][data.x].value ||
    //         data.room.currentTurn !== data.player.name
    //     )
    //         return;

    //     data.room.gameData[data.y][data.x].value = true;
    //     data.room.gameData[data.y][data.x].player =
    //         data.room.master === data.player.name ? "O" : "X";
    //     data.room.winner = checkGameOver(
    //         data.room.gameData[data.y][data.x].player,
    //         data.player,
    //         data.room.gameData
    //     );
    //     data.room.currentTurn =
    //         data.room.currentTurn ===
    //         data.room.players[Object.keys(data.room.players)[0]].name
    //             ? data.room.players[Object.keys(data.room.players)[1]].name
    //             : data.room.players[Object.keys(data.room.players)[0]].name;

    //     room = data.room;
    //     sendRoom(room, socket);
    // });

    // socket.on("resetRoom", (gameData: IGameCell[][]) => {
    //     room.gameData = gameData;
    //     room.winner = "";
    //     room.currentTurn = room.master;
    //     sendRoom(room, socket);
    // });

    // socket.on("sendRoom", (roomData) => {
    //     room = roomData;
    //     console.log(room, "sendRoom");
    //     sendRoom(room, socket);
    // });

    socket.on("disconnect", async () => {
        deletePlayer(io, socket);
    });

    // 수수께기
    // socket.on("registerAnswer", (answer) => {
    //     const gameData = room.gameData as GuessingData;
    //     gameData.answer = answer;
    //     gameData.state = "question";
    //     room.gameData = gameData;
    //     sendRoom(room, socket);
    // });

    // socket.on("submitReply", (reply: boolean) => {
    //     const newGameData = room.gameData as GuessingData;
    //     newGameData.history[newGameData.history.length - 1].answer = reply;
    //     newGameData.state =
    //         newGameData.history.length > 19 ? "over" : "question";
    //     room.gameData = newGameData;

    //     sendRoom(room, socket);
    // });
    // socket.on("submitQuestion", (question) => {
    //     const newGameData = room.gameData as GuessingData;
    //     newGameData.history.push({ question: question, answer: null });
    //     newGameData.state = "answer";
    //     room.gameData = newGameData;

    //     sendRoom(room, socket);
    // });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`${PORT} 포트에서 socket.io 서버 실행중`);
});
