import { QueueMeta, QueueType } from "@discord-player/core";
import type { ChannelResolvable, Guild, StageChannel, VoiceChannel } from "discord.js";
import { Player } from "../Player";
import { randomUUID } from "node:crypto";

export interface QueueOptions<T = unknown> {
    method?: QueueType;
    metadata?: T;
}

export class Queue<T = unknown> {
    public readonly id = randomUUID();
    private internal: QueueMeta;
    public readonly client = this.player.client;

    public constructor(public readonly player: Player, public readonly guild: Guild, public options?: QueueOptions<T>) {
        this.internal = new QueueMeta(this.options?.method || this.player.options?.defaultQueueMethod || "FIFO");
    }

    public connect(channel: ChannelResolvable, selfDeaf = true) {
        const vc = this.client.channels.resolve(channel) as VoiceChannel | StageChannel;
        if (!vc?.isVoice()) throw new TypeError("channel must be a voice based channel");

        this.player.options.gateway.join(vc, { selfDeaf });
    }
}
