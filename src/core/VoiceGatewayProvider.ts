import { Snowflake } from "discord-api-types";
import { Player } from "../Player";

export class VoiceGatewayProvider {
    constructor(public readonly player: Player) {}

    /* eslint-disable */
    public joinVoiceChannel(guildId: Snowflake, channelId: Snowflake): any {
        throw new Error("method not implemented");
    }

    public leaveVoiceChannel(guildId: Snowflake, channelId: Snowflake): any {
        throw new Error("method not implemented");
    }
    /* eslint-enable */
}
