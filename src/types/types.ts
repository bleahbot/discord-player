import { Snowflake, User, UserResolvable } from "discord.js";
import { Readable, Duplex } from "stream";
import { Queue } from "../Structures/Queue";
import Track from "../Structures/Track";
import { Playlist } from "../Structures/Playlist";
import { StreamDispatcher } from "../VoiceInterface/StreamDispatcher";

export type FiltersName = keyof QueueFilters;

/**
 * Result shape returned by a player search.
 * - `playlist` will be filled when the query resolves to a playlist (else `null`)
 * - `tracks` contains one or more resolved tracks
 */
export interface PlayerSearchResult {
    playlist: Playlist | null;
    tracks: Track[];
}

/**
 * @typedef {AudioFilters} QueueFilters
 * A set of boolean toggles for each supported audio filter. When `true`, the
 * corresponding filter is applied by FFmpeg (via `encoderArgs`).
 */
export interface QueueFilters {
    bassboost_low?: boolean;
    bassboost?: boolean;
    bassboost_high?: boolean;
    "8D"?: boolean;
    vaporwave?: boolean;
    nightcore?: boolean;
    phaser?: boolean;
    tremolo?: boolean;
    vibrato?: boolean;
    reverse?: boolean;
    treble?: boolean;
    normalizer?: boolean;
    normalizer2?: boolean;
    surrounding?: boolean;
    pulsator?: boolean;
    subboost?: boolean;
    karaoke?: boolean;
    flanger?: boolean;
    gate?: boolean;
    haas?: boolean;
    mcompand?: boolean;
    mono?: boolean;
    mstlr?: boolean;
    mstrr?: boolean;
    compressor?: boolean;
    expander?: boolean;
    softlimiter?: boolean;
    chorus?: boolean;
    chorus2d?: boolean;
    chorus3d?: boolean;
    fadein?: boolean;
    dim?: boolean;
    earrape?: boolean;
}

/**
 * The track source:
 * - soundcloud
 * - youtube
 * - spotify
 * - attachment
 * - arbitrary
 * @typedef {string} TrackSource
 */
export type TrackSource = "soundcloud" | "youtube" | "spotify" | "attachment" | "arbitrary";

/**
 * @typedef {object} RawTrackData
 * Raw metadata used to create a `Track` instance.
 */
export interface RawTrackData {
    /** The title shown to users */
    title: string;
    /** A short description or snippet for the track */
    description: string;
    /** Channel/artist/uploader name */
    author: string;
    /** Canonical URL of the track */
    url: string;
    /** Thumbnail URL (if any) */
    thumbnail: string;
    /** Formatted duration string (e.g., "3:45") */
    duration: string;
    /** View count (if known) */
    views: number;
    /** Who requested the track */
    requestedBy: User;
    /** Parent playlist, if created from one */
    playlist?: Playlist;
    /** Origin service */
    source?: TrackSource;
    /** Engine/handle needed by custom extractors (e.g., a function or stream) */
    engine?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    /** Whether the source is live */
    live?: boolean;
    /** Raw extractor payload for advanced consumers */
    raw?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * @typedef {object} TimeData
 * Structured time (days/hours/minutes/seconds).
 */
export interface TimeData {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

/**
 * Network/auth options that are passed down to the yt-dlp bridge and (for arbitrary URL inputs)
 * translated to FFmpeg headers/flags when possible.
 */
export interface YTDLPAgent {
    /** Proxy URL, e.g. http://user:pass@host:port or socks5://host:port */
    proxyUri?: string;
    /** Ask yt-dlp to read cookies from a browser profile */
    cookiesFromBrowser?: "chrome" | "brave" | "firefox" | "edge";
    /** Absolute path to cookies.txt (Netscape format) consumed by yt-dlp */
    cookiesFile?: string;
    /** Absolute path to cookies.json (array); auto-converted to Netscape cookies.txt for yt-dlp */
    cookiesJsonPath?: string;
    /** Explicit "Cookie: ..." header string (takes precedence over `cookies`) */
    cookiesHeader?: string;
    /** Cookies as raw header string, object map, or array of {name,value} */
    cookies?: any;
    /** If true, do not set a browser-like default User-Agent */
    noUA?: boolean;
    /** Prefer IPv4 in yt-dlp; note FFmpeg has no perfect equivalent for arbitrary URLs */
    forceIPv4?: boolean;
    /** Auto-detect and use cookies from the local browser profile. */
    autoCookiesFromBrowser?: boolean;
}

/**
 * @typedef {object} PlayerProgressbarOptions
 * Options for rendering the textual progress bar.
 */
export interface PlayerProgressbarOptions {
    /** Include current/end timecodes (e.g., "1:23 ┃ ▬🔘▬▬ ... ┃ 3:45") */
    timecodes?: boolean;
    /** Total length (characters) of the bar, excluding timecodes */
    length?: number;
    /** Glyph used for the bar fill */
    line?: string;
    /** Glyph used as the current position indicator */
    indicator?: string;
}

/**
 * @typedef {object} PlayerOptions
 * Global options that control queue/player behavior and stream creation.
 */
export interface PlayerOptions {
    /** Leave voice channel automatically when the queue ends */
    leaveOnEnd?: boolean;
    /** Cooldown (ms) before leaving on end (lets you enqueue quickly) */
    leaveOnEndCooldown?: number;
    /** Leave voice channel when `stop()` is called */
    leaveOnStop?: boolean;
    /** Leave when the voice channel becomes empty */
    leaveOnEmpty?: boolean;
    /** Cooldown (ms) before leaving on empty */
    leaveOnEmptyCooldown?: number;
    /** Self-deafen the bot to avoid audio loopback */
    autoSelfDeaf?: boolean;

    /**
     * Network/auth hints for yt-dlp bridge:
     * - proxy/cookies/cookiesFromBrowser/forceIPv4/User-Agent, etc.
     */
    ytdlpAgent?: YTDLPAgent;

    /** Initial playback volume (0–100) */
    initialVolume?: number;
    /** Delay (ms) before starting playback to allow buffering */
    bufferingTimeout?: number;
    /**
     * If `true`, tries to resolve Spotify tracks to YouTube equivalents
     * when the extractor doesn't provide a direct stream.
     */
    spotifyBridge?: boolean;
    /** If `true`, disables inline software volume control */
    disableVolume?: boolean;
    /**
     * Smooth volume transitions (0..1 recommended small values).
     * Leave undefined/0 to disable smoothing.
     */
    volumeSmoothness?: number;

    /**
     * Hook called before a stream is created.
     * Return a custom Readable to override default stream creation.
     */
    onBeforeCreateStream?: (track: Track, source: TrackSource, queue: Queue) => Promise<Readable>;
}

/**
 * @typedef {object} ExtractorModelData
 * Normalized data returned by custom extractors (tracks + optional playlist info).
 */

/**
 * @typedef {object} ExtractorData
 * Individual entry in a custom extractor response.
 */
export interface ExtractorModelData {
    playlist?: {
        /** Playlist title */
        title: string;
        /** Playlist description (if present) */
        description: string;
        /** Playlist thumbnail URL */
        thumbnail: string;
        /** 'album' or 'playlist' */
        type: "album" | "playlist";
        /** Source platform */
        source: TrackSource;
        /** Playlist author/channel */
        author: {
            name: string;
            url: string;
        };
        /** Playlist identifier */
        id: string;
        /** Canonical playlist URL */
        url: string;
        /** Raw extractor payload (optional) */
        rawPlaylist?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    };
    data: {
        /** Track title */
        title: string;
        /** Duration in seconds */
        duration: number;
        /** Thumbnail URL */
        thumbnail: string;
        /** Stream engine (URL, Readable, or Duplex) */
        engine: string | Readable | Duplex;
        /** View count */
        views: number;
        /** Uploader/artist/author name */
        author: string;
        /** Description/snippet */
        description: string;
        /** Canonical URL */
        url: string;
        /** Optional extractor version */
        version?: string;
        /** Source platform */
        source?: TrackSource;
    }[];
}

/**
 * The search query type
 * This can be one of:
 * - AUTO
 * - YOUTUBE
 * - YOUTUBE_PLAYLIST
 * - SOUNDCLOUD_TRACK
 * - SOUNDCLOUD_PLAYLIST
 * - SOUNDCLOUD
 * - SPOTIFY_SONG
 * - SPOTIFY_ALBUM
 * - SPOTIFY_PLAYLIST
 * - ATTACHMENT
 * - ARBITRARY
 * - YOUTUBE_SEARCH
 * - YOUTUBE_VIDEO
 * - SOUNDCLOUD_SEARCH
 * @typedef {number} QueryType
 */
export enum QueryType {
    AUTO,
    YOUTUBE,
    YOUTUBE_PLAYLIST,
    SOUNDCLOUD_TRACK,
    SOUNDCLOUD_PLAYLIST,
    SOUNDCLOUD,
    SPOTIFY_SONG,
    SPOTIFY_ALBUM,
    SPOTIFY_PLAYLIST,
    ATTACHMENT,
    ARBITRARY,
    YOUTUBE_SEARCH,
    YOUTUBE_VIDEO,
    SOUNDCLOUD_SEARCH
}

/**
 * Emitted when bot gets disconnected from a voice channel
 * @event Player#botDisconnect
 * @param {Queue} queue The queue
 */

/**
 * Emitted when the voice channel is empty
 * @event Player#channelEmpty
 * @param {Queue} queue The queue
 */

/**
 * Emitted when bot connects to a voice channel
 * @event Player#connectionCreate
 * @param {Queue} queue The queue
 * @param {StreamDispatcher} connection The discord player connection object
 */

/**
 * Debug information
 * @event Player#debug
 * @param {Queue} queue The queue
 * @param {string} message The message
 */

/**
 * Emitted on error
 * <warn>This event should handled properly otherwise it may crash your process!</warn>
 * @event Player#error
 * @param {Queue} queue The queue
 * @param {Error} error The error
 */

/**
 * Emitted on connection error. Sometimes stream errors are emitted here as well.
 * @event Player#connectionError
 * @param {Queue} queue The queue
 * @param {Error} error The error
 */

/**
 * Emitted when queue ends
 * @event Player#queueEnd
 * @param {Queue} queue The queue
 */

/**
 * Emitted when a single track is added
 * @event Player#trackAdd
 * @param {Queue} queue The queue
 * @param {Track} track The track
 */

/**
 * Emitted when multiple tracks are added
 * @event Player#tracksAdd
 * @param {Queue} queue The queue
 * @param {Track[]} tracks The tracks
 */

/**
 * Emitted when a track starts playing
 * @event Player#trackStart
 * @param {Queue} queue The queue
 * @param {Track} track The track
 */

/**
 * Emitted when a track ends
 * @event Player#trackEnd
 * @param {Queue} queue The queue
 * @param {Track} track The track
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PlayerEvents {
    botDisconnect: (queue: Queue) => any;
    channelEmpty: (queue: Queue) => any;
    connectionCreate: (queue: Queue, connection: StreamDispatcher) => any;
    debug: (queue: Queue, message: string) => any;
    error: (queue: Queue, error: Error) => any;
    connectionError: (queue: Queue, error: Error) => any;
    queueEnd: (queue: Queue) => any;
    trackAdd: (queue: Queue, track: Track) => any;
    tracksAdd: (queue: Queue, track: Track[]) => any;
    trackStart: (queue: Queue, track: Track) => any;
    trackEnd: (queue: Queue, track: Track) => any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * @typedef {object} PlayOptions
 * Options applied when starting playback for a specific track.
 */
export interface PlayOptions {
    /** `true` if this play call was triggered by a filter update (suppresses some events) */
    filtersUpdate?: boolean;
    /** Additional FFmpeg args (e.g., filters) merged into the encoder pipeline */
    encoderArgs?: string[];
    /** Seek position in milliseconds before starting playback */
    seek?: number;
    /** If `true`, start playing this track immediately, bypassing the queue */
    immediate?: boolean;
}

/**
 * @typedef {object} SearchOptions
 * How to perform a search and who requested it.
 */
export interface SearchOptions {
    /** Who requested the search (User, Snowflake or resolvable) */
    requestedBy: UserResolvable;
    /**
     * Search engine to use.
     * Can be a `QueryType` enum value or a custom extractor name.
     */
    searchEngine?: QueryType | string;
    /** If `true`, ignore any registered custom extractors */
    blockExtractor?: boolean;
}

/**
 * The queue repeat mode. This can be one of:
 * - OFF
 * - TRACK
 * - QUEUE
 * - AUTOPLAY
 * @typedef {number} QueueRepeatMode
 */
export enum QueueRepeatMode {
    OFF = 0,
    TRACK = 1,
    QUEUE = 2,
    AUTOPLAY = 3
}

/**
 * @typedef {object} PlaylistInitData
 * Shape used to create a `Playlist` instance.
 */
export interface PlaylistInitData {
    /** All tracks in the playlist (in initial order) */
    tracks: Track[];
    /** Playlist title */
    title: string;
    /** Playlist description/snippet */
    description: string;
    /** Playlist thumbnail URL */
    thumbnail: string;
    /** 'album' or 'playlist' */
    type: "album" | "playlist";
    /** Source platform */
    source: TrackSource;
    /** Playlist author/channel */
    author: {
        name: string;
        url: string;
    };
    /** Unique ID provided by the source platform */
    id: string;
    /** Canonical URL for the playlist */
    url: string;
    /** Raw payload returned by the extractor (optional) */
    rawPlaylist?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * @typedef {object} TrackJSON
 * JSON-safe representation of a `Track` used for logging/serialization.
 */
export interface TrackJSON {
    id: Snowflake;
    title: string;
    description: string;
    author: string;
    url: string;
    thumbnail: string;
    duration: string;
    /** Total duration in milliseconds */
    durationMS: number;
    views: number;
    /** ID of the user who requested the track */
    requestedBy: Snowflake;
    /** Parent playlist (if any), also in JSON-safe form */
    playlist?: PlaylistJSON;
}

/**
 * @typedef {object} PlaylistJSON
 * JSON-safe representation of a `Playlist`, including its tracks.
 */
export interface PlaylistJSON {
    id: string;
    url: string;
    title: string;
    description: string;
    thumbnail: string;
    /** 'album' or 'playlist' */
    type: "album" | "playlist";
    /** Source platform */
    source: TrackSource;
    /** Author/channel info */
    author: {
        name: string;
        url: string;
    };
    /** List of track JSON entries */
    tracks: TrackJSON[];
}

/**
 * @typedef {object} PlayerInitOptions
 * Initialization options for the Player constructor (top-level).
 */
export interface PlayerInitOptions {
    /**
     * Global network/auth hints used by the yt-dlp bridge:
     * - proxy/cookies/cookiesFromBrowser/forceIPv4/User-Agent, etc.
     */
    ytdlpAgent?: YTDLPAgent;
    /** Voice connection timeout in ms (when joining a channel) */
    connectionTimeout?: number;
}
