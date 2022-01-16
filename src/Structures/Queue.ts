import { QueueMeta, QueueType } from "@discord-player/core";
import type { Guild } from "discord.js";
import { Player } from "../Player";

export interface QueueOptions<T = unknown> {
    method?: QueueType;
    metadata?: T;
}

export class Queue<T = unknown> {
    private tracksQueue = new QueueMeta(this.options?.method || this.player.options?.defaultQueueMethod || "FIFO");
    public constructor(public readonly player: Player, public readonly guild: Guild, public options?: QueueOptions<T>) {}
}
