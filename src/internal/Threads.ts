import { Collection } from "discord.js";
import { PlayerEventEmitter } from "../utils/EventEmitter";
import { Worker } from "node:worker_threads";
import { WorkerMessagePayload } from "../utils/types";
import { WPType } from "../utils/constants";

interface ThreadsManagerOptions {
    max: number;
    workerPath: string | URL;
    respawn?: boolean;
}

interface ThreadsManagerEvents {
    workerCreate: (worker: Worker, id: string) => Awaited<void>;
}

export class ThreadsManager extends PlayerEventEmitter<ThreadsManagerEvents> {
    private recentWorkerId = 0;
    private workers = new Collection<string, Worker>();

    public constructor(public readonly options: ThreadsManagerOptions) {
        super();
    }

    private _getNextWorkerId() {
        return `worker::${process.pid}::${++this.recentWorkerId}`;
    }

    public spawn() {
        return new Promise((resolve, reject) => {
            const id = this._getNextWorkerId();
            if (this.workers.has(id)) return reject(new Error(`Worker ${id} already exists`));
            const worker = new Worker(this.options.workerPath);

            this.emit("workerCreate", worker, id);

            worker.on("message", (message: WorkerMessagePayload) => {
                if (message.op === WPType.HELLO) {
                    this.workers.set(id, worker);
                    return resolve({ id, worker });
                }

                if (!this.workers.has(id)) return reject(new Error(`Worker ${id} is not ready`));
            });
        });
    }
}
