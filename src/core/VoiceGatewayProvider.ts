import { Player } from "../Player";
import { GuildResolvable, StageChannel, VoiceChannel } from "discord.js";
import { DiscordGatewayAdapterCreator, entersState, getVoiceConnection, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { VoiceConnectionResolvable } from "../utils/types";

export interface VoiceGatewayJoinConfig {
    /**
     * Enter deaf mode
     */
    selfDeaf?: boolean;
}

export class VoiceGatewayProvider {
    constructor(public readonly player: Player) {}

    /**
     * Joins a voice channel
     * @param channel The voice channel to join
     * @param options The join options
     */
    public join(channel: StageChannel | VoiceChannel, options?: VoiceGatewayJoinConfig) {
        return joinVoiceChannel({
            adapterCreator: channel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
            channelId: channel.id,
            guildId: channel.guildId,
            selfDeaf: typeof options?.selfDeaf !== "boolean" ? true : Boolean(options.selfDeaf),
            selfMute: false
        });
    }

    /**
     * Enters ready state
     * @param c The voice connection
     * @param timeout The timeout (defaults to 30 seconds)
     */
    public async getReady(c: VoiceConnectionResolvable, timeout = 30_000) {
        const connection = this.resolveConnection(c);
        if (!connection) return;

        try {
            return await entersState(connection, VoiceConnectionStatus.Ready, timeout);
        } catch {
            throw new Error(`Could not create voice connection within ${timeout}ms!`);
        }
    }

    /**
     * Resolves voice connection
     * @param connection The voice connection to resolve
     */
    public resolveConnection(connection: VoiceConnectionResolvable) {
        return connection instanceof VoiceConnection ? connection : getVoiceConnection(connection);
    }

    /**
     * Destroys the voice connection
     * @param connection The voice connection
     */
    public destroy(connection: VoiceConnectionResolvable) {
        const vc = connection instanceof VoiceConnection ? connection : getVoiceConnection(connection);
        if (!vc) return;

        try {
            vc.destroy();
        } catch {
            /* noop */
        }
    }

    /**
     * Get connection from a guild
     * @param guild The guild to get voice connection from
     */
    public getConnection(guild: GuildResolvable) {
        const g = this.player.client.guilds.resolveId(guild);
        return getVoiceConnection(g);
    }

    /**
     * Checks if the connection is ready
     */
    public isReady(connection: VoiceConnectionResolvable) {
        const vc = this.resolveConnection(connection);
        if (!vc) return false;
        return vc.state.status === VoiceConnectionStatus.Ready;
    }
}
