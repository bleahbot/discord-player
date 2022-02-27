import type { VoiceConnection } from "@discordjs/voice";
import type { WPType } from "./constants";

export type Nullable<T = unknown> = T | null | undefined;
export type VoiceConnectionResolvable = VoiceConnection | string;
export interface WorkerMessagePayload {
    op: WPType;
    d: string;
}
