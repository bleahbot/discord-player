import { QueueType } from "@discord-player/core";
import { Client, Collection, GuildResolvable, Snowflake } from "discord.js";
import { Extractor } from "./plugins/Extractor";
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
    extractorCreate: (extractor: Extractor) => unknown;
    extractorClear: (extractors: Extractor[]) => unknown;
    extractorDelete: (extractor: Extractor) => unknown;
}

export interface PlayerOptions {
    disableEventsWarning?: boolean;
    defaultQueueMethod?: QueueType;
}

export class Player extends PlayerEventEmitter<PlayerEvents> {
    public queues = new Collection<Snowflake, Queue>();
    public extractors = new Collection<string, Extractor>();

    public constructor(public readonly client: Client<true>, public readonly options?: PlayerOptions) {
        super(["error", "connectionError"]);

        // eslint-disable-next-line no-extra-boolean-cast
        if (!!this.options?.disableEventsWarning)
            super.onWarning((eventName, events) => {
                process.emitWarning(`[DiscordPlayerWarning] Event ${eventName} does not have event listener. Events ${events.join(", ")} must have event listener.`);
            });
    }

    // #region extractors
    public registerExtractor(id: string, extractorConstructor: typeof Extractor) {
        if (this.extractors.has(id)) return this.extractors.get(id);
        const ext = new extractorConstructor(id, {
            player: this
        });

        this.extractors.set(id, ext);

        this.emit("extractorCreate", ext);

        return ext;
    }

    public getExtractor(id: string) {
        return this.extractors.get(id) ?? null;
    }

    public clearExtractors() {
        this.emit("extractorClear", [...this.extractors.values()]);
        return this.extractors.clear();
    }

    public unregisterExtractor(id: string) {
        const existing = this.extractors.get(id);
        if (existing) existing.willUnmount();
        const success = this.extractors.delete(id);
        if (success) this.emit("extractorDelete", existing);
        return success;
    }
    // #endregion extractors

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
            queues: this.queues.toJSON(),
            extractors: this.extractors.toJSON()
        };
    }

    public toString() {
        return this.valueOf();
    }

    public valueOf() {
        return `<Player ${this.queues.size} queues>`;
    }
}
