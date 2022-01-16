/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Readable } from "node:stream";

export class Extractor<T = unknown> {
    constructor(public readonly id: string, public readonly metadata: T) {}

    public async handleQuery(queryMetadata: ExtractorQueryMetadata): Promise<ExtractorResponseData> {
        throw new Error("method not implemented");
    }

    public willUnmount() {
        /* no-op */
    }

    public async validate(query: string) {
        return false;
    }
}

export interface ExtractorQueryMetadata {
    query: string;
}

export interface ExtractorResponseData {
    title: string;
    description: string | null;
    duration: number;
    source: string;
    thumbnail: string | null;
    author: {
        name: string;
        icon: string | null;
    } | null;
    readonly stream?: string | Readable;
}
