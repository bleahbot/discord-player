/** 
 * YouTube video IDs are 11 chars (letters, digits, - and _).
 * This validates ONLY the canonical 11-char video id.
 */
export function validateID(id: string): boolean {
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

/* ============================================================================
 * Hostname helpers
 * ==========================================================================*/

/** 
 * Returns true if hostname belongs to YouTube.
 * Accepts youtube.com and any subdomain (www, m, music, gaming, etc.),
 * plus the shortener youtu.be.
 */
export function isYouTubeHostname(hostname: string): boolean {
    const h = hostname.toLowerCase();
    return h === "youtube.com" ||
        h.endsWith(".youtube.com") ||
        h === "youtu.be";
}

/* ============================================================================
 * URL validators (coarse checks)
 * ==========================================================================*/

/**
 * Very loose YouTube URL validator.
 * It only checks the domain is YouTube / youtu.be and that there is a path.
 * Use the specific validators below for stricter checks (video/playlist/channel).
 */
export function validateURL(url: string): boolean {
    try {
        const u = new URL(url);
        return isYouTubeHostname(u.hostname) && (u.pathname?.length ?? 0) > 0;
    } catch {
        // Also allow bare "youtube.com/..." or "youtu.be/..." strings without protocol
        return /^(https?:\/\/)?(www\.)?(youtube\.com|([a-z0-9-]+\.)*youtube\.com|youtu\.be)\//i.test(url);
    }
}

/* ============================================================================
 * Specific YouTube URL validators (stricter)
 * ==========================================================================*/

/**
 * Validate common *video* URL forms:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 * - https://www.youtube.com/@handle/video/VIDEO_ID
 */
export function validateVideoURL(url: string): boolean {
    try {
        const u = new URL(normalizeUrl(url));
        if (!isYouTubeHostname(u.hostname)) return false;

        const path = u.pathname.replace(/\/+$/, ""); // trim trailing slash
        const idFromQuery = u.searchParams.get("v");

        // youtu.be short links: /VIDEO_ID
        if (u.hostname.toLowerCase() === "youtu.be") {
            const seg = path.split("/").filter(Boolean)[0];
            return !!seg && validateID(seg);
        }

        // youtube.com variants
        // /watch?v=VIDEO_ID
        if (path === "/watch" && idFromQuery && validateID(idFromQuery)) return true;

        // /shorts/VIDEO_ID
        let m = path.match(/^\/shorts\/([a-zA-Z0-9_-]{11})$/);
        if (m && validateID(m[1])) return true;

        // /embed/VIDEO_ID
        m = path.match(/^\/embed\/([a-zA-Z0-9_-]{11})$/);
        if (m && validateID(m[1])) return true;

        // /v/VIDEO_ID
        m = path.match(/^\/v\/([a-zA-Z0-9_-]{11})$/);
        if (m && validateID(m[1])) return true;

        // /live/VIDEO_ID (some streams/archives)
        m = path.match(/^\/live\/([a-zA-Z0-9_-]{11})$/);
        if (m && validateID(m[1])) return true;

        // /@handle/video/VIDEO_ID  or  /@handle/shorts/VIDEO_ID  or  /@handle/live/VIDEO_ID
        m = path.match(/^\/@[^/]+\/(video|shorts|live)\/([a-zA-Z0-9_-]{11})$/);
        if (m && validateID(m[2])) return true;

        return false;
    } catch {
        return false;
    }
}

/**
 * Validate *clip* URL forms:
 * - https://www.youtube.com/clip/CLIP_ID   (IDs are longer/variable vs video IDs)
 */
export function validateClipURL(url: string): boolean {
    try {
        const u = new URL(normalizeUrl(url));
        if (!isYouTubeHostname(u.hostname)) return false;
        const path = u.pathname.replace(/\/+$/, "");
        return /^\/clip\/[A-Za-z0-9_-]{16,}$/.test(path);
    } catch {
        return false;
    }
}

/* ============================================================================
 * Utilities
 * ==========================================================================*/

/** 
 * Normalize URLs that may come without protocol.
 * If a protocol is missing, assume https://
 */
function normalizeUrl(input: string): string {
    if (/^https?:\/\//i.test(input)) return input;
    return `https://${input}`;
}