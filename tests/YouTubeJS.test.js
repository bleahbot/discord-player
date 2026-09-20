const assert = require("node:assert/strict");
const { describe, test } = require("node:test");
const { ytjsGetPlaylist } = require("../dist/utils/YouTubeJS");
const { playlistId, videoId, videoUrl, playlistUrl, thumbnail, createPlaylistVideo, createShortsVideo, mockYouTubePlaylist } = require("./helpers/YouTube");

describe("YouTubeJS playlist normalization", () => {
    const youtube = mockYouTubePlaylist();

    test("extracts playable URLs and metadata from LockupView entries", async () => {
        const result = await ytjsGetPlaylist(playlistUrl);
        const first = result.videos[0];

        assert.equal(first.id, videoId);
        assert.equal(first.url, videoUrl);
        assert.equal(first.title, "Playlist song");
        assert.equal(first.channel.name, "Test artist");
        assert.equal(first.durationFormatted, "3:42");
        assert.equal(first.thumbnail.url, thumbnail);
    });

    test("reads playlist metadata from Playlist.info", async () => {
        const result = await ytjsGetPlaylist(playlistUrl);

        assert.equal(result.title, "Test playlist");
        assert.equal(result.channel.name, "Playlist owner");
        assert.equal(result.thumbnail, thumbnail);
        assert.equal(result.url, `https://www.youtube.com/playlist?list=${playlistId}`);
    });

    test("preserves legacy PlaylistVideo entries and their order", async () => {
        const result = await ytjsGetPlaylist(playlistUrl);
        const second = result.videos[1];

        assert.equal(second.id, "oj5sHx9sweg");
        assert.equal(second.title, "Legacy song");
        assert.equal(second.url, "https://www.youtube.com/watch?v=oj5sHx9sweg");
        assert.equal(second.durationFormatted, "4:12");
    });

    test("excludes recommendations, unavailable entries and malformed video IDs", async () => {
        youtube.response.items.push(createPlaylistVideo({ isPlayable: false }), { type: "LockupView", content_id: "invalid" }, {});
        youtube.response.videos = [...youtube.response.items, createPlaylistVideo({ videoId: "aqz-KE-bpKQ" })];

        const result = await ytjsGetPlaylist(playlistUrl);

        assert.deepEqual(
            result.videos.map((video) => video.id),
            [videoId, "oj5sHx9sweg"]
        );
    });

    test("supports ShortsLockupView entries without an id property", async () => {
        youtube.response.items = [createShortsVideo()];

        const result = await ytjsGetPlaylist(playlistUrl);

        assert.equal(result.videos.length, 1);
        assert.equal(result.videos[0].url, videoUrl);
        assert.equal(result.videos[0].title, "Short song");
        assert.equal(result.videos[0].thumbnail.url, thumbnail);
    });

    test("supports legacy playlist responses without items or info properties", async () => {
        youtube.response = { title: "Legacy playlist", author: "Legacy owner", videos: [createPlaylistVideo()] };

        const result = await ytjsGetPlaylist(playlistUrl);

        assert.equal(result.title, "Legacy playlist");
        assert.equal(result.channel.name, "Legacy owner");
        assert.equal(result.videos.length, 1);
        assert.equal(result.videos[0].id, "oj5sHx9sweg");
    });

    test("formats numeric durations instead of stringifying duration objects", async () => {
        const video = createPlaylistVideo();
        video.duration = { seconds: 252 };
        youtube.response.items = [video];

        const result = await ytjsGetPlaylist(playlistUrl);

        assert.equal(result.videos[0].durationFormatted, "04:12");
    });

    test("returns no tracks when every entry is unusable", async () => {
        youtube.response.items = [{}, createPlaylistVideo({ isPlayable: false })];

        const result = await ytjsGetPlaylist(playlistUrl);

        assert.deepEqual(result.videos, []);
    });

    test("provides defaults when a valid video has no optional metadata", async () => {
        youtube.response.items = [{ content_id: videoId }];

        const result = await ytjsGetPlaylist(playlistUrl);

        assert.equal(result.videos[0].url, videoUrl);
        assert.equal(result.videos[0].title, "Unknown Title");
        assert.equal(result.videos[0].durationFormatted, "0:00");
    });
});
