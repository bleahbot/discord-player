const assert = require("node:assert/strict");
const { describe, test } = require("node:test");
const { QueryResolver, QueryType } = require("../dist");
const { playlistId, videoId, videoUrl, playlistUrl } = require("./helpers/YouTube");

describe("QueryResolver", () => {
    test("resolves playlist links before standalone video links", () => {
        const queries = [playlistUrl, playlistUrl.replace("www.", "music."), `https://www.youtube.com/playlist?list=${playlistId}`, `https://youtu.be/${videoId}?list=${playlistId}`, playlistId];

        for (const query of queries) {
            assert.equal(QueryResolver.resolve(query), QueryType.YOUTUBE_PLAYLIST, query);
        }
    });

    test("preserves standalone YouTube and YouTube Music videos", () => {
        const queries = [videoUrl, videoUrl.replace("www.", "music."), `https://youtu.be/${videoId}`, videoId];

        for (const query of queries) {
            assert.equal(QueryResolver.resolve(query), QueryType.YOUTUBE_VIDEO, query);
        }
    });

    test("resolves plain text as a YouTube search", () => {
        assert.equal(QueryResolver.resolve("Nicole Cherry Te-am asteptat"), QueryType.YOUTUBE_SEARCH);
    });
});
