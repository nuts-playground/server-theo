import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";
import { socketEvent } from ".";

const prisma = new PrismaClient();

export const createChat = async ({
    text,
    name,
    io,
}: {
    text: string;
    name: string;
    io: Server;
}) => {
    const chat = await prisma.chat.create({ data: { player: name, text } });
    io.sockets.emit(socketEvent.CHAT, chat);
};
