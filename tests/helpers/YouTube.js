const assert = require("node:assert/strict");
const { before, beforeEach, after, mock } = require("node:test");
const { Innertube, YTNodes } = require("youtubei.js");

const playlistId = "PL2oSsDTDZXA88j_UcvtwwXfoTfDrazKgC";
const videoId = "uLZhMJgGg4g";
const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
const playlistUrl = `${videoUrl}&list=${playlistId}`;
const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

/**
 * Creates a playlist video using the YouTube.js LockupView parser
 * @param {object} [overrides={}] The raw renderer properties to override
 * @returns {object} The parsed video
 */
function createLockupVideo(overrides = {}) {
    return new YTNodes.LockupView({
        contentId: videoId,
        contentType: "LOCKUP_CONTENT_TYPE_VIDEO",
        metadata: {
            lockupMetadataViewModel: {
                title: { content: "Playlist song" },
                metadata: {
                    contentMetadataViewModel: {
                        metadataRows: [
                            {
                                metadataParts: [
                                    {
                                        text: {
                                            content: "Test artist",
                                            commandRuns: [
                                                {
                                                    startIndex: 0,
                                                    length: 11,
                                                    onTap: { innertubeCommand: { browseEndpoint: { browseId: "UCtest" } } }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        },
        contentImage: {
            thumbnailViewModel: {
                image: { sources: [{ url: thumbnail, width: 480, height: 360 }] },
                overlays: [{ thumbnailOverlayBadgeViewModel: { thumbnailBadges: [{ thumbnailBadgeViewModel: { text: "3:42" } }] } }]
            }
        },
        ...overrides
    });
}

/**
 * Creates a playlist video using the legacy YouTube.js parser
 * @param {object} [overrides={}] The raw renderer properties to override
 * @returns {object} The parsed video
 */
function createPlaylistVideo(overrides = {}) {
    return new YTNodes.PlaylistVideo({
        videoId: "oj5sHx9sweg",
        title: { simpleText: "Legacy song", accessibility: { accessibilityData: { label: "Legacy song" } } },
        shortBylineText: { runs: [{ text: "Legacy artist" }] },
        thumbnail: { thumbnails: [{ url: thumbnail, width: 480, height: 360 }] },
        isPlayable: true,
        lengthText: { simpleText: "4:12" },
        lengthSeconds: "252",
        ...overrides
    });
}

/**
 * Creates a short video using the YouTube.js ShortsLockupView parser
 * @returns {object} The parsed short video
 */
function createShortsVideo() {
    return new YTNodes.ShortsLockupView({
        entityId: "shorts-item",
        thumbnail: { sources: [{ url: thumbnail, width: 480, height: 360 }] },
        onTap: { innertubeCommand: { reelWatchEndpoint: { videoId } } },
        overlayMetadata: { primaryText: { content: "Short song" } }
    });
}

/**
 * Creates a playlist response containing both supported video layouts
 * @returns {object} The playlist response
 */
function createPlaylistResponse() {
    const items = [createLockupVideo(), createPlaylistVideo()];

    return {
        info: { title: "Test playlist", author: { name: "Playlist owner" }, thumbnails: [{ url: thumbnail }] },
        items,
        videos: items
    };
}

/**
 * Mocks the YouTube client for the current test suite
 * @returns {object} Mutable response and error state, reset before each test
 */
function mockYouTubePlaylist() {
    const state = { response: null, error: null };

    before(() => {
        mock.method(Innertube, "create", async () => ({
            getPlaylist: async (id) => {
                assert.equal(id, playlistId);
                if (state.error) throw state.error;
                return state.response;
            }
        }));
    });

    beforeEach(() => {
        state.response = createPlaylistResponse();
        state.error = null;
    });

    after(() => mock.restoreAll());

    return state;
}

module.exports = { playlistId, videoId, videoUrl, playlistUrl, thumbnail, createLockupVideo, createPlaylistVideo, createShortsVideo, mockYouTubePlaylist };
