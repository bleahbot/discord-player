import { QueueType } from "@discord-player/core";
import { Client, Collection, GuildResolvable, Snowflake } from "discord.js";
import { VoiceGatewayProvider } from "./core/VoiceGatewayProvider";
import { Queue, QueueOptions } from "./Structures/Queue";
import { PlayerEventEmitter } from "./utils/EventEmitter";

export interface PlayerEvents {
    ready: (player: Player) => unknown;
    error: (queue: Queue, error: Error) => unknown;
    connectionError: (queue: Queue, error: Error) => unknown;
    warn: (queue: Queue, warning: string) => unknown;
    queueCreate: (queue: Queue) => unknown;
    queueClear: (queues: Queue[]) => unknown;
    queueDelete: (queue: Queue) => unknown;
}

export interface PlayerOptions {
    disableEventsWarning?: boolean;
    defaultQueueMethod?: QueueType;
    gateway: VoiceGatewayProvider;
}

export class Player extends PlayerEventEmitter<PlayerEvents> {
    public queues = new Collection<Snowflake, Queue>();

    public constructor(public readonly client: Client<true>, public readonly options: PlayerOptions) {
        super(["error", "connectionError"]);

        if (!this.options.gateway || !(this.options.gateway instanceof VoiceGatewayProvider)) throw new TypeError("invalid voice gateway provider");

        // eslint-disable-next-line no-extra-boolean-cast
        if (!!this.options?.disableEventsWarning)
            super.onWarning((eventName, events) => {
                process.emitWarning(`[DiscordPlayerWarning] Event ${eventName} does not have event listener. Events ${events.join(", ")} must have event listener.`);
            });
    }

    public getVoiceManager() {
        return this.options.gateway;
    }

    // #region queue
    public clearQueue() {
        this.emit("queueClear", [...this.queues.values()]);
        return this.queues.clear();
    }

    public createQueue<T = unknown>(guildResolvable: GuildResolvable, options: QueueOptions<T>) {
        const guild = this.client.guilds.resolve(guildResolvable);
        if (!guild) throw new Error("Could not resolve guild");
        if (this.queues.has(guild.id)) return this.queues.get(guild.id) as Queue<T>;
        const queue = new Queue(this, guild, options) as Queue<T>;
        this.queues.set(guild.id, queue);
        this.emit("queueCreate", queue);
        return queue;
    }

    public deleteQueue(guildResolvable: GuildResolvable) {
        const guild = this.client.guilds.resolve(guildResolvable);
        if (!guild) throw new Error("Could not resolve guild");

        const prev = this.queues.get(guild.id);
        const success = this.queues.delete(guild.id);
        if (success && prev) this.emit("queueDelete", prev);
        return success;
    }

    public hasQueue(guildResolvable: GuildResolvable) {
        const guild = this.client.guilds.resolve(guildResolvable);
        if (!guild) throw new Error("Could not resolve guild");
        return this.queues.has(guild.id);
    }

    public *[Symbol.iterator](): IterableIterator<Queue> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_, queue] of this.queues) {
            yield queue;
        }
    }
    // #endregion queue

    public toJSON() {
        return {
            queues: this.queues.toJSON()
        };
    }

    public toString() {
        return this.valueOf();
    }

    public valueOf() {
        return `<Player ${this.queues.size} queues>`;
    }
}
