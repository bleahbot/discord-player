import { VoiceConnection } from "@discordjs/voice";
import { Queue } from "../Structures/Queue";

export class Connection {
    public constructor(public readonly queue: Queue, public connection: VoiceConnection) {}
}
