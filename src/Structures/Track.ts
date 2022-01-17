import { Player } from "../Player";
import { randomUUID } from "crypto";
import { Nullable } from "../utils/types";

export interface TrackOptions {
    title: Nullable<string>;
    description: Nullable<string>;
    duration: number;
    source: string;
    image: Nullable<string>;
    author: Nullable<string | { name: string; url: string }>;
    createdAt: Nullable<Date | number>;
    extractor: string;
}

export class Track<T = unknown> {
    public readonly id = randomUUID();
    public metadata: T;

    public constructor(public readonly player: Player, public readonly options: TrackOptions & { metadata: T }) {
        this.metadata = options.metadata;
    }
}
