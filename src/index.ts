import http from "http";
import { Server } from "socket.io";
import { checkGameOver } from "./tictactoe/tictactoe";
import { getRooms, createRoom, joinRoom } from "./room";
import {
    createPlayer,
    getPlayers,
    deletePlayer,
    updateLocation,
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

const socketEvent = {
    SEND_ROOM: "sendRoom",
    SEND_ROOMS: "sendRooms",
    SEND_PLAYERS: "sendPlayers",
};

const sendPlayers = async () => {
    const players = await getPlayers();
    io.sockets.emit(socketEvent.SEND_PLAYERS, players);
};

io.on("connection", async (socket) => {
    const players = await getPlayers();

    sendPlayers();
    socket.on("joinPlayground", async ({ name, location }) => {
        const player = await createPlayer({
            socket: socket.id,
            name,
            location,
        });
        socket.emit("joinPlayground", player);
        sendPlayers();
    });

    socket.on("updateLocation", async (location: string) => {
        await updateLocation(socket.id, location);
        await sendPlayers();
    });

    socket.on("getRooms", async (gameName) => {
        const rooms = await getRooms(gameName);
        socket.emit("sendRooms", rooms);
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
        console.log(rooms);
        console.log(sockets);
        socket.to(sockets).emit(socketEvent.SEND_ROOMS, rooms);
        socket.emit(socketEvent.SEND_ROOM, room);
    });

    socket.on("joinRoom", async ({ id }) => {
        const room = await joinRoom({ id, socket: socket.id });
        if (!room) return false;
        const sockets = room.players.map((player) => {
            if (typeof player === "object" && player !== null) {
                return (player as Player).socket;
            }
        }) as string[];

        socket.to(sockets).emit(socketEvent.SEND_ROOM, room);
        socket.emit(socketEvent.SEND_ROOM, room);
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
        await deletePlayer(socket.id);
        sendPlayers();
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
