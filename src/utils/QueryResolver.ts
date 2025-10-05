import { validateID, validateURL } from "../utils/youtubeValidators";
import { YouTube } from "youtube-sr";
import { QueryType } from "../types/types";

// SoundCloud (regex simple)
const SC_PLAYLIST_RE = /^(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/[^\/]+\/sets\/[^\/?#]+(?:[/?#].*)?$/i;
const SC_TRACK_RE = /^(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/[^\/]+\/(?!sets\/)[^\/?#]+(?:[/?#].*)?$/i;

// Spotify
const SP_SONG_RE = /^(?:https:\/\/open\.spotify\.com\/(intl-([a-z]|[A-Z]){0,3}\/)?(?:user\/[A-Za-z0-9]+\/)?|spotify:)(track)(?:[/:])([A-Za-z0-9]+).*$/;
const SP_PLAYLIST_RE = /^(?:https:\/\/open\.spotify\.com\/(intl-([a-z]|[A-Z]){0,3}\/)?(?:user\/[A-Za-z0-9]+\/)?|spotify:)(playlist)(?:[/:])([A-Za-z0-9]+).*$/;
const SP_ALBUM_RE = /^(?:https:\/\/open\.spotify\.com\/(intl-([a-z]|[A-Z]){0,3}\/)?(?:user\/[A-Za-z0-9]+\/)?|spotify:)(album)(?:[/:])([A-Za-z0-9]+).*$/;

// Attachments (generic URL)
const ATTACHMENT_RE = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;

class QueryResolver {
  private constructor() {}

  static resolve(query: string): QueryType {
    // SoundCloud
    if (SC_PLAYLIST_RE.test(query) || query.includes("/sets/")) return QueryType.SOUNDCLOUD_PLAYLIST;
    if (SC_TRACK_RE.test(query)) return QueryType.SOUNDCLOUD_TRACK;

    // YouTube
    if (YouTube.isPlaylist(query)) return QueryType.YOUTUBE_PLAYLIST;
    if (validateID(query) || validateURL(query)) return QueryType.YOUTUBE_VIDEO;

    // Spotify
    if (SP_SONG_RE.test(query)) return QueryType.SPOTIFY_SONG;
    if (SP_PLAYLIST_RE.test(query)) return QueryType.SPOTIFY_PLAYLIST;
    if (SP_ALBUM_RE.test(query)) return QueryType.SPOTIFY_ALBUM;

    // Attachments
    if (ATTACHMENT_RE.test(query)) return QueryType.ATTACHMENT;

    // Default
    return QueryType.YOUTUBE_SEARCH;
  }
}

export { QueryResolver };
