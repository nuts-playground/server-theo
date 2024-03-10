import http from "http";
import { Server } from "socket.io";
import { Player, Room, Rooms, IGameCell, GuessingData } from "../types";
import { checkGameOver } from "./tictactoe/tictactoe";
import { getRooms, sendRoom, sendRooms, createRoom } from "./room";
import { sendPlayers, createPlayer, getPlayers, deletePlayer } from "./player";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // await prisma.player.create({
    //     data: {
    //         name: "Thoe",
    //     },
    // });
    // await prisma.player.deleteMany({});
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

const connectedId: string[] = [];

io.on("connection", async (socket) => {
    let room: Room = {} as Room;
    let player: Player | null;

    sendRooms(io.sockets);
    sendPlayers(io.sockets);

    connectedId.push(socket.id);

    socket.on("joinPlayground", async (playerName) => {
        player = await createPlayer(socket.id, playerName);
        const players = await getPlayers();
        socket.emit("joinPlayground", player);

        sendPlayers(io.sockets);
    });

    socket.on("createRoom", async (roomData: Room) => {
        await createRoom(roomData.name, roomData.game.name);
        await sendRooms(io.sockets);
    });

    // socket.on("joinRoom", (roomData) => {
    //     const roomIndex = rooms[roomData.game].findIndex(
    //         (room) => room.id === roomData.id
    //     );

    //     if (Object.keys(rooms[roomData.game][roomIndex].players).length < 2) {
    //         rooms[roomData.game][roomIndex].players[roomData.player.id] =
    //             roomData.player;
    //         room = rooms[roomData.game][roomIndex];
    //         sendRoom(room, socket);
    //     }
    //     sendRooms(rooms, connectedId, socket);
    // });

    socket.on("turnEnd", (data) => {
        if (
            data.room.gameData[data.y][data.x].value ||
            data.room.currentTurn !== data.player.name
        )
            return;

        data.room.gameData[data.y][data.x].value = true;
        data.room.gameData[data.y][data.x].player =
            data.room.master === data.player.name ? "O" : "X";
        data.room.winner = checkGameOver(
            data.room.gameData[data.y][data.x].player,
            data.player,
            data.room.gameData
        );
        data.room.currentTurn =
            data.room.currentTurn ===
            data.room.players[Object.keys(data.room.players)[0]].name
                ? data.room.players[Object.keys(data.room.players)[1]].name
                : data.room.players[Object.keys(data.room.players)[0]].name;

        room = data.room;
        sendRoom(room, socket);
    });

    socket.on("resetRoom", (gameData: IGameCell[][]) => {
        room.gameData = gameData;
        room.winner = "";
        room.currentTurn = room.master;
        sendRoom(room, socket);
    });

    socket.on("sendRoom", (roomData) => {
        room = roomData;
        console.log(room, "sendRoom");
        sendRoom(room, socket);
    });

    socket.on("disconnect", () => {
        if (player) deletePlayer(socket.id);

        // sendPlayers(io.sockets);
        // exitRoom(room, rooms, connectedId, socket);
    });

    // 수수께기
    socket.on("registerAnswer", (answer) => {
        const gameData = room.gameData as GuessingData;
        gameData.answer = answer;
        gameData.state = "question";
        room.gameData = gameData;
        sendRoom(room, socket);
    });

    socket.on("submitReply", (reply: boolean) => {
        const newGameData = room.gameData as GuessingData;
        newGameData.history[newGameData.history.length - 1].answer = reply;
        newGameData.state =
            newGameData.history.length > 19 ? "over" : "question";
        room.gameData = newGameData;

        sendRoom(room, socket);
    });
    socket.on("submitQuestion", (question) => {
        const newGameData = room.gameData as GuessingData;
        newGameData.history.push({ question: question, answer: null });
        newGameData.state = "answer";
        room.gameData = newGameData;

        sendRoom(room, socket);
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`${PORT} 포트에서 socket.io 서버 실행중`);
});
