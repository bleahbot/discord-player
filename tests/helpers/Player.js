const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { PassThrough } = require("node:stream");
const { Player, Queue } = require("../../dist");
const ytdlp = require("../../dist/utils/YTDLP");

/**
 * Creates a player without connecting to Discord
 * @returns {Player} The player
 */
function createPlayer() {
    const client = new EventEmitter();
    client.users = { resolve: () => null };

    const player = new Player(client);
    player.scanDeps = () => "test";

    return player;
}

/**
 * Creates a queue with simulated audio and voice connections
 * @param {object} context The test context used to restore mocks and streams
 * @param {Player} [player] The player that owns the queue
 * @returns {object} The queue, stream mock and playback result
 */
function createPlaybackQueue(context, player = createPlayer()) {
    const pcm = new PassThrough();
    context.after(() => pcm.destroy());

    const stream = context.mock.method(ytdlp.default, "createPCMStream", () => pcm);
    const queue = new Queue(player, { id: "test-guild" }, { bufferingTimeout: 0 });
    const played = [];
    let resolvePlayback;
    let playbackTimeout;
    const playback = new Promise((resolve, reject) => {
        resolvePlayback = resolve;
        playbackTimeout = setTimeout(() => reject(new Error("The queue did not start playback.")), 1500);
    });
    context.after(() => clearTimeout(playbackTimeout));

    queue.connection = {
        voiceConnection: {},
        createStream: (source, options) => {
            assert.equal(source, pcm);
            return { metadata: options.data };
        },
        setVolume: () => true,
        playStream: (resource) => {
            played.push(resource.metadata);
            clearTimeout(playbackTimeout);
            resolvePlayback(resource.metadata);
        }
    };

    return { queue, stream, played, playback };
}

module.exports = { createPlayer, createPlaybackQueue };
