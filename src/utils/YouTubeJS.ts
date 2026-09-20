import { Util } from "./Util";
import { validateID } from "./youtubeValidators";
import type { YTNodes } from "youtubei.js";

/* =========================================================
 * YouTube.js client
 * =======================================================*/
type YoutubeiModule = typeof import("youtubei.js");
type YT = Awaited<ReturnType<YoutubeiModule["Innertube"]["create"]>>;

let ytModulePromise: Promise<YoutubeiModule> | null = null;
let yt: YT | null = null;

const YTJS_FILTER_KEY = "[YOUTUBEJS]";
let youtubeJsConsolePatched = false;

/** Loads youtubei.js on first use and shares the import promise. */
async function loadYoutubei(): Promise<YoutubeiModule> {
    if (!ytModulePromise) {
        ytModulePromise = import("youtubei.js");
    }

    return ytModulePromise;
}

/** Reuses the initialized InnerTube client with an in-memory cache. */
export async function getYT() {
    if (yt) return yt;

    const mod = await loadYoutubei();
    const { Innertube, UniversalCache } = mod;

    yt = await Innertube.create({
        cache: new UniversalCache(false)
    });

    return yt;
}

/* =========================================================
 * Video/playlist IDs
 * =======================================================*/
/**
 * Extracts a video ID from a watch or youtu.be URL.
 * Raw IDs and unrecognized input are returned unchanged, apart from whitespace.
 */
export function extractVideoId(input: string): string {
    const s = String(input).trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;

    try {
        const u = new URL(s);

        if (u.hostname.includes("youtu.be")) {
            return u.pathname.replace(/^\/+/, "").slice(0, 11);
        }

        const v = u.searchParams.get("v");
        if (v) return v;
    } catch {}

    return s;
}

/** Reads the list parameter from a URL, or returns the trimmed input as a playlist ID. */
export function extractPlaylistId(input: string): string {
    const s = String(input).trim();

    try {
        const u = new URL(s);
        const list = u.searchParams.get("list");
        if (list) return list;
    } catch {}

    return s;
}

/* =========================================================
 * Video metadata and search
 * =======================================================*/
/**
 * Fetches video metadata in the shape used by Player.search.
 * Returns null when the response has no title.
 */
export async function ytjsGetVideo(query: string) {
    const yt = await getYT();
    const videoId = extractVideoId(query);

    const info: any = await yt.getInfo(videoId);

    const basic = info?.basic_info ?? {};

    const title =
        basic?.title?.text ||
        basic?.title ||
        info?.primary_info?.title?.text ||
        info?.video_details?.title ||
        "";

    const author =
        basic?.author ||
        basic?.channel?.name ||
        info?.basic_info?.channel?.name ||
        info?.secondary_info?.owner?.author?.name ||
        info?.video_details?.author ||
        "";

    const thumbs =
        Array.isArray(basic?.thumbnail) ? basic.thumbnail :
        Array.isArray(info?.basic_info?.thumbnail) ? info.basic_info.thumbnail :
        Array.isArray(info?.video_details?.thumbnails) ? info.video_details.thumbnails :
        [];

    const thumb = thumbs.length ? thumbs[thumbs.length - 1]?.url : "";

    const url =
        basic?.url_canonical ||
        info?.basic_info?.url_canonical ||
        `https://www.youtube.com/watch?v=${basic?.id || videoId}`;

    const durationSeconds =
        Number(basic?.duration || 0) ||
        Number(info?.basic_info?.duration || 0) ||
        Number(info?.video_details?.length_seconds || 0);

    const views =
        Number(basic?.view_count || 0) ||
        Number(info?.basic_info?.view_count || 0) ||
        Number(info?.video_details?.view_count || 0);

    if (!title) return null;

    return {
        id: basic?.id || info?.basic_info?.id || videoId,
        title,
        description:
            basic?.short_description ||
            info?.video_details?.short_description ||
            "",
        url,
        channel: {
            name: author || "Unknown"
        },
        thumbnail: {
            url: thumb || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : ""),
            displayThumbnailURL: () => thumb || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "")
        },
        views,
        durationFormatted: Util.buildTimeCode(
            Util.parseMS((durationSeconds * 1000) || 0)
        ),
        raw: info
    };
}

/** Searches for videos and maps the results to the player's track fields. */
export async function ytjsSearchVideos(query: string) {
    const yt = await getYT();
    const res: any = await yt.search(query, { type: "video" });

    const items: any[] =
        Array.isArray(res?.videos) ? res.videos :
        Array.isArray(res?.results) ? res.results :
        [];

    return items.map((item: any) => {
        const thumbs = Array.isArray(item?.thumbnails) ? item.thumbnails : [];
        const thumb = thumbs.length ? thumbs[thumbs.length - 1]?.url : "";

        return {
            id: item?.id || "",
            title: item?.title?.text || item?.title || "Unknown Title",
            description: item?.description?.text || item?.description || "",
            url: item?.url || (item?.id ? `https://www.youtube.com/watch?v=${item.id}` : ""),
            channel: {
                name: item?.author?.name || item?.author || item?.channel?.name || "Unknown"
            },
            thumbnail: {
                url: thumb,
                displayThumbnailURL: () => thumb
            },
            views: Number(item?.view_count || item?.views || 0),
            durationFormatted:
                item?.duration?.text ||
                item?.duration?.toString?.() ||
                item?.duration_text ||
                "0:00",
            raw: item
        };
    });
}

/* =========================================================
 * Playlist metadata
 * =======================================================*/
/**
 * Loads one playlist page and maps its video entries to track metadata.
 * Entries without valid video IDs or marked unplayable are left out.
 */
export async function ytjsGetPlaylist(query: string) {
    const yt = await getYT();
    const playlistId = extractPlaylistId(query);

    const playlist: any = await yt.getPlaylist(playlistId);

    // items excludes recommended videos that can appear in the videos collection.
    const videos: any[] = Array.isArray(playlist?.items) ? playlist.items : Array.isArray(playlist?.videos) ? playlist.videos : [];

    const info = playlist?.info ?? playlist;
    const playlistThumbs = Array.isArray(info?.thumbnails) ? info.thumbnails : [];
    const playlistThumb = playlistThumbs.length ? playlistThumbs[playlistThumbs.length - 1]?.url : "";

    return {
        id: playlist?.id || playlistId,
        title: info?.title || "YouTube Playlist",
        url: playlist?.url || `https://www.youtube.com/playlist?list=${playlist?.id || playlistId}`,
        thumbnail: playlistThumb,
        channel: {
            name: info?.author?.name || info?.author || info?.channel?.name || "Unknown",
            url: info?.author?.url || info?.channel?.url || null
        },
        videos: videos
            .map((video: any) => {
                // LockupView uses content_id; Shorts expose the ID through a watch endpoint.
                const id = [
                    video?.id,
                    video?.content_id,
                    video?.endpoint?.payload?.videoId,
                    video?.on_tap_endpoint?.payload?.videoId,
                    video?.renderer_context?.command_context?.on_tap?.payload?.videoId
                ].find((value) => typeof value === "string" && validateID(value));
                if (!id || video?.is_playable === false) return null;

                const thumbs = Array.isArray(video?.thumbnails)
                    ? video.thumbnails
                    : Array.isArray(video?.content_image?.image)
                    ? video.content_image.image
                    : Array.isArray(video?.thumbnail)
                    ? video.thumbnail
                    : [];
                const thumb = thumbs.length ? thumbs[thumbs.length - 1]?.url : "";

                // The channel link separates the artist from view counts and other metadata.
                const metadataRows: YTNodes.ContentMetadataView["metadata_rows"] = video?.metadata?.metadata?.metadata_rows ?? [];
                const metadataParts = metadataRows.flatMap((row) => row.metadata_parts ?? []);
                const author = metadataParts.find((part) => part.text?.endpoint?.payload?.browseId?.startsWith("UC"))?.text?.text;

                // LockupView carries the duration in a thumbnail badge.
                const overlays: Array<{ badges?: YTNodes.ThumbnailBadgeView[] }> = video?.content_image?.overlays ?? [];
                const badges = overlays.flatMap((overlay) => overlay.badges ?? []);
                const durationBadge = badges.find((badge) => /^\d+(?::\d{2}){1,2}$/.test(badge.text ?? ""));

                return {
                    id,
                    title: video?.title?.text || video?.title || video?.metadata?.title?.text || video?.overlay_metadata?.primary_text?.text || "Unknown Title",
                    description: video?.description?.text || video?.description || "",
                    url: `https://www.youtube.com/watch?v=${id}`,
                    channel: {
                        name: video?.author?.name || video?.author || video?.channel?.name || author || "Unknown"
                    },
                    thumbnail: { url: thumb },
                    views: Number(video?.view_count || video?.views || 0),
                    durationFormatted:
                        video?.duration?.text ||
                        video?.duration_text ||
                        durationBadge?.text ||
                        (typeof video?.duration?.seconds === "number" ? Util.buildTimeCode(Util.parseMS(video.duration.seconds * 1000)) : typeof video?.duration === "string" ? video.duration : "") ||
                        "0:00",
                    raw: video
                };
            })
            .filter((video): video is NonNullable<typeof video> => video !== null),
        raw: playlist
    };
}

/* =========================================================
 * Autoplay
 * =======================================================*/
/**
 * Picks another video from the watch recommendations, falling back to search.
 * Returns null when neither source provides a different video.
 */
export async function ytjsGetAutoplayVideo(urlOrId: string) {
    const yt = await getYT();
    const currentId = extractVideoId(urlOrId);

    const info: any = await yt.getInfo(currentId);

    let feed: any[] = Array.isArray(info?.watch_next_feed) ? info.watch_next_feed : [];

    // Try the first continuation when the initial response has no recommendations.
    if (!feed.length && info?.wn_has_continuation && typeof info?.getWatchNextContinuation === "function") {
        let continued: any = null;

        try {
            continued = await info.getWatchNextContinuation();
        } catch {
            continued = null;
        }

        feed = Array.isArray(continued?.watch_next_feed) ? continued.watch_next_feed : [];
    }

    const directCandidate =
        feed.find((x: any) => {
            const id = x?.id || x?.video_id;
            return id && id !== currentId;
        }) || null;

    if (directCandidate) {
        const id = directCandidate?.id || directCandidate?.video_id || "";
        const thumbs = Array.isArray(directCandidate?.thumbnails) ? directCandidate.thumbnails : [];
        const thumb =
            thumbs.length ? thumbs[thumbs.length - 1]?.url : (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "");

        return {
            id,
            title: directCandidate?.title?.text || directCandidate?.title || "Unknown Title",
            author:
                directCandidate?.author?.name ||
                directCandidate?.author ||
                directCandidate?.channel?.name ||
                "Unknown",
            url:
                directCandidate?.url ||
                (id ? `https://www.youtube.com/watch?v=${id}` : ""),
            thumbnail: thumb,
            views: Number(directCandidate?.view_count || directCandidate?.views || 0),
            durationFormatted:
                directCandidate?.duration?.text ||
                directCandidate?.duration?.toString?.() ||
                directCandidate?.duration_text ||
                "0:00",
            raw: directCandidate
        };
    }

    // Use the current artist and title when the watch feed has no other video.
    const fallbackQuery = `${info?.basic_info?.author || ""} ${info?.basic_info?.title || ""}`.trim();
    if (!fallbackQuery) return null;

    let searched: any[] = [];

    try {
        searched = await ytjsSearchVideos(fallbackQuery);
    } catch {
        searched = [];
    }

    const next = searched.find((x: any) => x?.id && x.id !== currentId);

    return next || null;
}

/* =========================================================
 * YouTube.js console output
 * =======================================================*/
/** Checks all console arguments for the YouTube.js log prefix. */
function shouldHideYoutubeJsLog(args: unknown[]): boolean {
    const text = args
        .map((arg) => {
            if (typeof arg === "string") return arg;
            if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack ?? ""}`;
            try {
                return JSON.stringify(arg);
            } catch {
                return String(arg);
            }
        })
        .join(" ");

    return text.includes(YTJS_FILTER_KEY);
}

/**
 * Installs the YouTube.js filter on the process-wide console methods once.
 * Other messages go through the original handlers, including errors.
 */
function patchConsoleForYoutubeJs() {
    if (youtubeJsConsolePatched) return;
    youtubeJsConsolePatched = true;

    const original = {
        log: console.log.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
        debug: console.debug.bind(console)
    };

    console.log = (...args: unknown[]) => {
        if (shouldHideYoutubeJsLog(args)) return;
        original.log(...args);
    };

    console.info = (...args: unknown[]) => {
        if (shouldHideYoutubeJsLog(args)) return;
        original.info(...args);
    };

    console.warn = (...args: unknown[]) => {
        if (shouldHideYoutubeJsLog(args)) return;
        original.warn(...args);
    };

    console.error = (...args: unknown[]) => {
        if (shouldHideYoutubeJsLog(args)) return;
        original.error(...args);
    };

    console.debug = (...args: unknown[]) => {
        if (shouldHideYoutubeJsLog(args)) return;
        original.debug(...args);
    };
}

patchConsoleForYoutubeJs();
