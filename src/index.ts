import http from "http";
import { Server } from "socket.io";
import { Player, Room, Rooms, IGameCell, GuessingData } from "../types";
import { checkGameOver } from "./tictactoe/tictactoe";
import { exitRoom, sendRoom, sendRooms } from "./room";
import { sendPlayers } from "./player";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// const httpServer = http.createServer();

// const io = new Server(httpServer, {
//     cors: {
//         origin: "http://localhost:3000",
//         methods: ["GET", "POST"],
//         credentials: true,
//     },
// });

// const rooms: Rooms = {} as Rooms;
// const players: Player[] = [];
// const connectedId: string[] = [];

// io.on("connection", (socket) => {
//     let room: Room = {} as Room;
//     connectedId.push(socket.id);
//     socket.emit("sendRooms", rooms);
//     socket.emit("sendPlayers", players);
//     socket.on("exitRoom", () => exitRoom(room, rooms, connectedId, socket));

//     socket.on("joinPlayground", (playerName) => {
//         const hasPlayer = players.some((player) => player.name === playerName);
//         if (hasPlayer) {
//             socket.emit("joinPlayground", false);
//             return false;
//         }

//         const player: Player = {
//             id: socket.id,
//             name: playerName,
//             location: "로비",
//         };
//         players.push(player);
//         sendPlayers(connectedId, players, socket);
//         socket.emit("joinPlayground", player);
//     });

//     socket.on("getRoom", () => socket.emit("getRoom", rooms));

//     socket.on("ready", (isReady) => {
//         if (!room.id) return false;
//         room.players[socket.id].isReady = isReady;
//         sendRoom(room, socket);
//     });

//     socket.on("createRoom", (roomData) => {
//         room = { ...roomData, id: Date.now() };
//         rooms[room.game.name]
//             ? rooms[room.game.name].push(room)
//             : (rooms[room.game.name] = [room]);

//         sendRoom(room, socket);
//         sendRooms(rooms, connectedId, socket);
//     });

//     socket.on("joinRoom", (roomData) => {
//         const roomIndex = rooms[roomData.game].findIndex(
//             (room) => room.id === roomData.id
//         );

//         if (Object.keys(rooms[roomData.game][roomIndex].players).length < 2) {
//             rooms[roomData.game][roomIndex].players[roomData.player.id] =
//                 roomData.player;
//             room = rooms[roomData.game][roomIndex];
//             sendRoom(room, socket);
//         }
//         sendRooms(rooms, connectedId, socket);
//     });

//     socket.on("turnEnd", (data) => {
//         if (
//             data.room.gameData[data.y][data.x].value ||
//             data.room.currentTurn !== data.player.name
//         )
//             return;

//         data.room.gameData[data.y][data.x].value = true;
//         data.room.gameData[data.y][data.x].player =
//             data.room.master === data.player.name ? "O" : "X";
//         data.room.winner = checkGameOver(
//             data.room.gameData[data.y][data.x].player,
//             data.player,
//             data.room.gameData
//         );
//         data.room.currentTurn =
//             data.room.currentTurn ===
//             data.room.players[Object.keys(data.room.players)[0]].name
//                 ? data.room.players[Object.keys(data.room.players)[1]].name
//                 : data.room.players[Object.keys(data.room.players)[0]].name;

//         room = data.room;
//         sendRoom(room, socket);
//     });

//     socket.on("resetRoom", (gameData: IGameCell[][]) => {
//         room.gameData = gameData;
//         room.winner = "";
//         room.currentTurn = room.master;
//         sendRoom(room, socket);
//     });

//     socket.on("sendRoom", (roomData) => {
//         room = roomData;
//         console.log(room, "sendRoom");
//         sendRoom(room, socket);
//     });

//     socket.on("disconnect", () => {
//         console.log("유저 제거");
//         const playerIndex = players.findIndex(
//             (player) => player.id === socket.id
//         );

//         const idIndex = connectedId.findIndex((id) => id === socket.id);
//         connectedId.splice(idIndex);
//         players.splice(playerIndex);
//         sendPlayers(connectedId, players, socket);
//         exitRoom(room, rooms, connectedId, socket);
//     });

//     // 수수께기
//     socket.on("registerAnswer", (answer) => {
//         const gameData = room.gameData as GuessingData;
//         gameData.answer = answer;
//         gameData.state = "question";
//         room.gameData = gameData;
//         sendRoom(room, socket);
//     });

//     socket.on("submitReply", (reply: boolean) => {
//         const newGameData = room.gameData as GuessingData;
//         newGameData.history[newGameData.history.length - 1].answer = reply;
//         newGameData.state =
//             newGameData.history.length > 19 ? "over" : "question";
//         room.gameData = newGameData;

//         sendRoom(room, socket);
//     });
//     socket.on("submitQuestion", (question) => {
//         const newGameData = room.gameData as GuessingData;
//         newGameData.history.push({ question: question, answer: null });
//         newGameData.state = "answer";
//         room.gameData = newGameData;

//         sendRoom(room, socket);
//     });
// });

// const PORT = process.env.PORT || 3001;
// httpServer.listen(PORT, () => {
//     console.log(`${PORT} 포트에서 socket.io 서버 실행중`);
// });
