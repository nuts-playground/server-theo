import http from "http";
import { Server } from "socket.io";
const httpServer = http.createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "https://playground.mynameishomin.com/",
        methods: ["GET", "POST"],
        credentials: true,
    },
});
const rooms = {};
const players = [];
const connectedId = [];
const checkGameOver = (marker, player, gameData) => {
    const lineArray = [
        // 가로 3줄
        [gameData[0][0], gameData[0][1], gameData[0][2]],
        [gameData[1][0], gameData[1][1], gameData[1][2]],
        [gameData[2][0], gameData[2][1], gameData[2][2]],
        // 세로 3줄
        [gameData[0][0], gameData[1][0], gameData[2][0]],
        [gameData[0][1], gameData[1][1], gameData[2][1]],
        [gameData[0][2], gameData[1][2], gameData[2][2]],
        // 대각선 2줄
        [gameData[0][0], gameData[1][1], gameData[2][2]],
        [gameData[0][2], gameData[1][1], gameData[2][0]],
    ];
    for (let i = 0; i < lineArray.length; i++) {
        if (lineArray[i].every((item) => item.player === marker)) {
            return player.name;
        }
    }
    let cellArray = gameData.reduce(function (prev, next) {
        return prev.concat(next);
    });
    if (cellArray.every((cell) => cell.value)) {
        return "drow";
    }
    return "";
};
io.on("connection", (socket) => {
    let room = {};
    connectedId.push(socket.id);
    console.log(`${connectedId.length}명 접속 중`);
    const sendPlayers = () => {
        connectedId.forEach((id) => socket.to(id).emit("sendPlayers", players));
        socket.emit("sendPlayers", players);
        console.log(connectedId);
        console.log(`${connectedId.length}명에게 ${players.length}명 보냄`);
    };
    const sendRooms = () => {
        connectedId.forEach((id) => socket.to(id).emit("sendRooms", rooms));
        socket.emit("sendRooms", rooms);
    };
    socket.on("getPlayers", () => {
        socket.emit("sendPlayers", players);
    });
    socket.on("joinPlayground", (playerName) => {
        const hasPlayer = players.some((player) => player.name === playerName);
        if (hasPlayer) {
            socket.emit("joinPlayground", false);
            return false;
        }
        const newPlayer = {
            id: socket.id,
            name: playerName,
            isReady: false,
            location: "로비",
        };
        players.push(newPlayer);
        sendPlayers();
        socket.emit("joinPlayground", newPlayer);
        socket.emit("sendRooms", rooms);
    });
    const sendRoom = () => {
        if (room.id) {
            Object.keys(room.players).forEach((id) => {
                socket.to(id).emit("sendRoom", room);
            });
        }
        socket.emit("sendRoom", room);
    };
    const exitRoom = () => {
        if (!room.id) return false;
        delete room.players[socket.id];
        if (!Object.keys(room.players).length) {
            const roomIndex = rooms[room.game.name].findIndex(
                (item) => item.id === room.id
            );
            rooms[room.game.name].splice(roomIndex);
            room = {
                id: 0,
            };
            sendRoom();
            sendRooms();
        } else {
            sendRoom();
            room = {
                id: 0,
            };
            sendRoom();
        }
    };
    socket.on("getRoom", () => socket.emit("getRoom", rooms));
    socket.on("ready", (isReady) => {
        if (!room.id) return false;
        room.players[socket.id].isReady = isReady;
        sendRoom();
    });
    socket.on("createRoom", (roomData) => {
        const players = {};
        players[roomData.player.id] = roomData.player;
        const newRoom = {
            id: Date.now(),
            name: roomData.name,
            players: players,
            isStart: false,
            gameData: roomData.gameData,
            currentTurn: roomData.currentTurn,
            winner: "",
            master: roomData.player.name,
            game: {
                name: roomData.game.name,
                maxPlayers: roomData.game.maxPlayers,
                minPlayers: roomData.game.minPlayers,
            },
        };
        room = newRoom;
        if (!rooms[roomData.game.name]) rooms[roomData.game.name] = [];
        rooms[roomData.game.name].push(room);
        sendRoom();
        sendRooms();
        console.log("방 생성", newRoom);
    });
    socket.on("joinRoom", (roomData) => {
        const roomIndex = rooms[roomData.game].findIndex(
            (room) => room.id === roomData.id
        );
        if (Object.keys(rooms[roomData.game][roomIndex].players).length < 2) {
            rooms[roomData.game][roomIndex].players[roomData.player.id] =
                roomData.player;
            room = rooms[roomData.game][roomIndex];
            sendRoom();
        }
        sendRooms();
    });
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
        sendRoom();
    });
    socket.on("resetRoom", (gameData) => {
        room.gameData = gameData;
        room.winner = "";
        room.currentTurn = room.master;
        sendRoom();
    });
    socket.on("exitRoom", () => exitRoom());
    socket.on("sendRoom", (roomData) => {
        room = roomData;
        console.log(room, "sendRoom");
        sendRoom();
    });
    socket.on("updateRoom", (roomData) => {
        room = roomData;
    });
    socket.on("getRooms", () => sendRooms());
    socket.on("disconnect", () => {
        console.log("유저 제거");
        const playerIndex = players.findIndex(
            (player) => player.id === socket.id
        );
        const idIndex = connectedId.findIndex((id) => id === socket.id);
        connectedId.splice(idIndex);
        players.splice(playerIndex);
        sendPlayers();
        exitRoom();
    });
    // 수수께기
    socket.on("registerAnswer", (answer) => {
        const gameData = room.gameData;
        gameData.answer = answer;
        gameData.state = "question";
        room.gameData = gameData;
        sendRoom();
    });
    socket.on("submitReply", (reply) => {
        const newGameData = room.gameData;
        newGameData.history[newGameData.history.length - 1].answer = reply;
        newGameData.state =
            newGameData.history.length > 19 ? "over" : "question";
        room.gameData = newGameData;
        sendRoom();
    });
    socket.on("submitQuestion", (question) => {
        const newGameData = room.gameData;
        newGameData.history.push({ question: question, answer: null });
        newGameData.state = "answer";
        room.gameData = newGameData;
        sendRoom();
    });
});
const PORT = process.env.PORT || 80;
httpServer.listen(PORT, () => {
    console.log(`${PORT} 포트에서 socket.io 서버 실행중`);
});
