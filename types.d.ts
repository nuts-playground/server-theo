import { Player } from "@prisma/client";
interface RoomPlayer extends Player {
    ready: boolean;
    isMaster: boolean;
}
