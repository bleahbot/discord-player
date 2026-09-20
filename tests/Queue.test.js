const assert = require("node:assert/strict");
const { describe, test } = require("node:test");
const { Queue, Track, ErrorStatusCode } = require("../dist");
const { createPlayer, createPlaybackQueue } = require("./helpers/Player");
const { videoUrl } = require("./helpers/YouTube");

describe("Queue playback", () => {
    test("emits an explicit error when a track has no playable URL", async () => {
        const player = createPlayer();
        const errors = [];
        player.on("error", (...args) => errors.push(args[1]));
        const queue = new Queue(player, { id: "test-guild" });
        queue.connection = { voiceConnection: {} };
        queue.addTrack(new Track(player, { title: "Broken playlist entry", url: "", source: "youtube" }));

        await queue.play();

        assert.equal(errors.length, 1);
        assert.equal(errors[0].statusCode, ErrorStatusCode.INVALID_TRACK);
        assert.match(errors[0].message, /Broken playlist entry/);
    });

    test("skips an invalid entry and plays the next track without consuming later tracks", { timeout: 2000 }, async (context) => {
        const player = createPlayer();
        const errors = [];
        player.on("error", (...args) => errors.push(args[1]));
        const { queue, stream, playback } = createPlaybackQueue(context, player);
        const broken = new Track(player, { title: "Broken", url: "", source: "youtube" });
        const next = new Track(player, { title: "Next", url: videoUrl, source: "youtube" });
        const later = new Track(player, { title: "Later", url: "https://www.youtube.com/watch?v=oj5sHx9sweg", source: "youtube" });
        queue.addTracks([broken, next, later]);

        await queue.play();

        assert.equal(await playback, next);
        assert.equal(errors.length, 1);
        assert.equal(stream.mock.callCount(), 1);
        assert.deepEqual(queue.tracks, [later]);
    });

    test("does not create an audio stream when every queued track is invalid", async (context) => {
        const player = createPlayer();
        const errors = [];
        player.on("error", (...args) => errors.push(args[1]));
        const { queue, stream } = createPlaybackQueue(context, player);
        queue.addTracks([new Track(player, { title: "First broken entry", url: "", source: "youtube" }), new Track(player, { title: "Second broken entry", url: "", source: "youtube" })]);

        await queue.play();

        assert.equal(errors.length, 2);
        assert.equal(stream.mock.callCount(), 0);
        assert.deepEqual(queue.tracks, []);
    });

    test("preserves standalone video playback", { timeout: 2000 }, async (context) => {
        const { queue, stream, playback } = createPlaybackQueue(context);
        const track = new Track(queue.player, { title: "Single song", url: videoUrl, source: "youtube" });
        queue.addTrack(track);

        await queue.play();

        assert.equal(await playback, track);
        assert.equal(stream.mock.callCount(), 1);
        assert.deepEqual(queue.tracks, []);
    });
});
