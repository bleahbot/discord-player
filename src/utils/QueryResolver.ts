import { YtdlCore } from "@ybd-project/ytdl-core";
import { YouTube } from "youtube-sr";
import { QueryType } from "../types/types";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { validateURL as SoundcloudValidateURL } from "soundcloud-scraper";

// scary things below *sigh*
const spotifySongRegex = /^(?:https:\/\/open\.spotify\.com\/(intl-([a-z]|[A-Z]){0,3}\/)?(?:user\/[A-Za-z0-9]+\/)?|spotify:)(track)(?:[/:])([A-Za-z0-9]+).*$/;
const spotifyPlaylistRegex = /^(?:https:\/\/open\.spotify\.com\/(intl-([a-z]|[A-Z]){0,3}\/)?(?:user\/[A-Za-z0-9]+\/)?|spotify:)(playlist)(?:[/:])([A-Za-z0-9]+).*$/;
const spotifyAlbumRegex = /^(?:https:\/\/open\.spotify\.com\/(intl-([a-z]|[A-Z]){0,3}\/)?(?:user\/[A-Za-z0-9]+\/)?|spotify:)(album)(?:[/:])([A-Za-z0-9]+).*$/;
const attachmentRegex =
    /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
// scary things above *sigh*

class QueryResolver {
    /**
     * Query resolver
     */
    private constructor() {} // eslint-disable-line @typescript-eslint/no-empty-function

    /**
     * Resolves the given search query
     * @param {string} query The query
     * @returns {QueryType}
     */
    static resolve(query: string): QueryType {
        if (SoundcloudValidateURL(query, "track")) return QueryType.SOUNDCLOUD_TRACK;
        if (SoundcloudValidateURL(query, "playlist") || query.includes("/sets/")) return QueryType.SOUNDCLOUD_PLAYLIST;
        if (YouTube.isPlaylist(query)) return QueryType.YOUTUBE_PLAYLIST;
        if (YtdlCore.validateID(query) || YtdlCore.validateURL(query)) return QueryType.YOUTUBE_VIDEO;
        if (spotifySongRegex.test(query)) return QueryType.SPOTIFY_SONG;
        if (spotifyPlaylistRegex.test(query)) return QueryType.SPOTIFY_PLAYLIST;
        if (spotifyAlbumRegex.test(query)) return QueryType.SPOTIFY_ALBUM;
        if (attachmentRegex.test(query)) return QueryType.ATTACHMENT;

        return QueryType.YOUTUBE_SEARCH;
    }
}

export { QueryResolver };
