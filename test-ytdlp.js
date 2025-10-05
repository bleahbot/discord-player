// test-ytdlp.js (CommonJS)
const fs = require('fs');
const path = require('path');

// Import from your built utils
const ytdlp = require('./dist/utils/YTDLP').default;
const { setFFmpegPath } = require('./dist/utils/YTDLP');

// If you use ffmpeg-static and don't have prism-media, set the binary path explicitly
try {
    const ffmpegPath = require('ffmpeg-static');
    if (ffmpegPath) setFFmpegPath(ffmpegPath);
} catch (_) {
    // ffmpeg-static not installed; it's fine if ffmpeg is available in PATH
}

(async () => {
    const url = 'https://www.youtube.com/watch?v=JBhTJyT2UPg';

    // Agent can hold proxy, cookies, or both.
    // Cookies may be a string "a=b; c=d" OR an array of objects [{ name, value }, ...]
    const agent = {
        // proxyUri: 'http://user:pass@host:8080',
        // cookiesFromBrowser: 'chrome',
        // cookiesFile: '/ABSOLUTE/path/cookies.txt',
        // cookiesJsonPath: '/ABSOLUTE/path/cookies.json',
        // cookies: [{ name:'LOGIN_INFO', value:'---xxx---' }, { name:'SAPISID', value:'...' }],
        // noUA: false,
        // forceIPv4: false,
        // autoCookiesFromBrowser: true
    };

    // 1) Optional: fetch metadata first. If this fails with "Sign in..."
    // your cookies/proxy are likely not being applied correctly.
    const info = await ytdlp.getInfo(url, { agent }).catch(() => null);
    console.log('Title:', info?.videoDetails?.title || '(no info)');

    // 2) Download/record audio to a file — pick a container with headers like "mp3" or "wav".
    // Create the output folder if it does not exist.
    const outDir = path.resolve(__dirname, 'output');
    fs.mkdirSync(outDir, { recursive: true });

    const outFile = path.join(outDir, 'audio.mp3');
    const ws = fs.createWriteStream(outFile);

    // Build the PCM/transcode stream using ytdlp bridge
    const stream = ytdlp.createPCMStream(url, {
        agent,
        fmt: 'mp3', // or 'wav'; avoid raw 's16le' if you want a directly playable file
        encoderArgs: ['-b:a', '192k'], // optional encoder settings (bitrate, filters, etc.)
        seek: 0
    });

    // Basic error handling on both ends of the pipe
    stream.on('error', (e) => {
        console.error('Stream error:', e?.message || e);
        try { ws.destroy(); } catch { }
    });

    ws.on('error', (e) => {
        console.error('Write error:', e?.message || e);
        try { stream.destroy(); } catch { }
    });

    ws.on('finish', () => {
        console.log('✅ Saved to:', outFile);
    });

    // Pipe stream -> file
    stream.pipe(ws);

    // Optional: allow Ctrl+C to cleanly close the stream and file
    const onSigint = () => {
        console.log('\nAborting...');
        try { stream.destroy(); } catch { }
        try { ws.destroy(); } catch { }
        process.exit(130);
    };
    process.once('SIGINT', onSigint);
})();
