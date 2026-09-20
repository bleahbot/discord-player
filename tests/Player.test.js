const assert = require("node:assert/strict");
const { describe, test } = require("node:test");
const { QueryType } = require("../dist");
const ytdlp = require("../dist/utils/YTDLP");
const { createPlayer, createPlaybackQueue } = require("./helpers/Player");
const { playlistId, videoId, videoUrl, playlistUrl, mockYouTubePlaylist } = require("./helpers/YouTube");

describe("Player playlist search", () => {
    const youtube = mockYouTubePlaylist();

    test("creates ordered tracks linked to their playlist and requester", async (context) => {
        const fallback = context.mock.method(ytdlp, "getPlaylistInfo", async () => null);
        const player = createPlayer();
        const requester = { id: "test-user" };
        player.client.users.resolve = () => requester;

        const result = await player.search(playlistUrl, { searchEngine: QueryType.AUTO, requestedBy: requester });

        assert.equal(result.playlist.title, "Test playlist");
        assert.equal(result.tracks.length, 2);
        assert.equal(result.tracks[0].url, videoUrl);
        assert.equal(result.tracks[1].title, "Legacy song");
        assert.equal(result.tracks[0].durationMS, 222000);
        assert.ok(result.tracks.every((track) => track.playlist === result.playlist && track.requestedBy === requester && track.source === "youtube"));
        assert.equal(fallback.mock.callCount(), 0);
    });

    test("supports YouTube Music playlist URLs", async (context) => {
        const fallback = context.mock.method(ytdlp, "getPlaylistInfo", async () => null);
        const result = await createPlayer().search(playlistUrl.replace("www.", "music."), { searchEngine: QueryType.AUTO });

        assert.equal(result.tracks[0].url, videoUrl);
        assert.equal(result.tracks.length, 2);
        assert.equal(fallback.mock.callCount(), 0);
    });

    test("falls back to yt-dlp when every YouTube.js entry is unusable", async (context) => {
        youtube.response.items = youtube.response.videos = [{}];
        const fallback = context.mock.method(ytdlp, "getPlaylistInfo", async () => ({
            entries: [{ id: videoId, title: "Fallback song", duration: 222 }],
            raw: { id: playlistId, title: "Fallback playlist" }
        }));

        const result = await createPlayer().search(playlistUrl, { searchEngine: QueryType.AUTO });

        assert.equal(fallback.mock.callCount(), 1);
        assert.equal(result.tracks[0].url, videoUrl);
        assert.equal(result.tracks[0].title, "Fallback song");
    });

    test("falls back to yt-dlp when YouTube.js rejects the playlist request", async (context) => {
        youtube.error = new Error("Playlist lookup failed");
        const fallback = context.mock.method(ytdlp, "getPlaylistInfo", async () => ({
            entries: [{ id: videoId, title: "Fallback song" }],
            raw: { id: playlistId }
        }));

        const result = await createPlayer().search(playlistUrl, { searchEngine: QueryType.AUTO });

        assert.equal(fallback.mock.callCount(), 1);
        assert.equal(result.tracks[0].url, videoUrl);
    });

    test("returns an empty result when neither provider supplies playable tracks", async (context) => {
        youtube.response.items = [];
        context.mock.method(ytdlp, "getPlaylistInfo", async () => null);

        const result = await createPlayer().search(playlistUrl, { searchEngine: QueryType.AUTO });

        assert.deepEqual(result, { playlist: null, tracks: [] });
    });

    test("starts the first search result and retains the remaining queue", { timeout: 2000 }, async (context) => {
        context.mock.method(ytdlp, "getPlaylistInfo", async () => null);
        const player = createPlayer();
        const result = await player.search(playlistUrl, { searchEngine: QueryType.AUTO });
        const { queue, stream, playback } = createPlaybackQueue(context, player);

        queue.addTracks(result.tracks);
        await queue.play();

        assert.equal(await playback, result.tracks[0]);
        assert.equal(stream.mock.callCount(), 1);
        assert.equal(stream.mock.calls[0].arguments[0], videoUrl);
        assert.deepEqual(queue.tracks, [result.tracks[1]]);
    });
});
