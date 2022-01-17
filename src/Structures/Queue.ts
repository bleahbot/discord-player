import { QueueMeta, QueueType } from "@discord-player/core";
import type { Guild } from "discord.js";
import { Player } from "../Player";
import { randomUUID } from "crypto";

export interface QueueOptions<T = unknown> {
    method?: QueueType;
    metadata?: T;
}

export class Queue<T = unknown> {
    public readonly id = randomUUID();
    private tracksQueue: QueueMeta;
    public constructor(public readonly player: Player, public readonly guild: Guild, public options?: QueueOptions<T>) {
        this.tracksQueue = new QueueMeta(this.options?.method || this.player.options?.defaultQueueMethod || "FIFO");
    }
}
