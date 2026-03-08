# Discord Player
This is a fork of discord-player module

Complete framework to facilitate music commands using **[discord.js](https://discord.js.org)**.

## Installation
> ⚠️ Discord Player requires Discord.js 13.x. Please ensure that you have a compatible version by running npm list discord.js in your terminal.

### Install **[@bleah/discord-player](https://npmjs.com/package/@bleah/discord-player)**

```sh
$ npm install --save @bleah/discord-player
```

### Install **[@discordjs/opus](https://npmjs.com/package/@discordjs/opus)**

```sh
$ npm install --save @discordjs/opus
```

- or `opusscript`
```sh
$ npm install --save opusscript
```

### Install FFmpeg
- FFMPEG Binary: **[https://www.ffmpeg.org/download.html](https://www.ffmpeg.org/download.html)**
- FFMPEG Node Module: **[https://npmjs.com/package/ffmpeg-static](https://npmjs.com/package/ffmpeg-static)**

### Install YT-DLP (optional)
- YT-DLP Binary: **[https://github.com/yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp)**

# Features
- Simple & easy to use 🤘
- Beginner friendly 😱
- Audio filters 🎸
- Lightweight ☁️
- Custom extractors support 🌌
- Multiple sources support ✌
- Play in multiple servers at the same time 🚗
- Does not inject anything to discord.js or your discord.js client 💉
- Allows you to have full control over what is going to be streamed 👑

## [Documentation](https://discord-player.js.org)

## Getting Started

First of all, you will need to register slash commands:

```js
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const commands = [{
    name: "play",
    description: "Plays a song!",
    options: [
        {
            name: "query",
            type: "STRING",
            description: "The song you want to play",
            required: true
        }
    ]
}]; 

const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Started refreshing application [/] commands.");

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands },
    );

    console.log("Successfully reloaded application [/] commands.");
  } catch (error) {
    console.error(error);
  }
})();
```

Now you can implement your bot's logic:

```js
const { Client, Intents } = require("discord.js");
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES] });
const { Player } = require("@bleah/discord-player");

// Create a new Player (you don't need any API Key)
const player = new Player(client);

// add the trackStart event so when a song will be played this message will be sent
player.on("trackStart", (queue, track) => queue.metadata.channel.send(`🎶 | Now playing **${track.title}**!`))

client.once("ready", () => {
    console.log("I'm ready !");
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    // /play track:Despacito
    // will play "Despacito" in the voice channel
    if (interaction.commandName === "play") {
        if (!interaction.member.voice.channelId) return await interaction.reply({ content: "You are not in a voice channel!", ephemeral: true });
        if (interaction.guild.members.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) return await interaction.reply({ content: "You are not in my voice channel!", ephemeral: true });
        const query = interaction.options.get("query").value;
        const queue = player.createQueue(interaction.guild, {
            metadata: {
                channel: interaction.channel
            }
        });
        
        // verify vc connection
        try {
            if (!queue.connection) await queue.connect(interaction.member.voice.channel);
        } catch {
            queue.destroy();
            return await interaction.reply({ content: "Could not join your voice channel!", ephemeral: true });
        }

        await interaction.deferReply();
        const track = await player.search(query, {
            requestedBy: interaction.user
        }).then(x => x.tracks[0]);
        if (!track) return await interaction.followUp({ content: `❌ | Track **${query}** not found!` });

        queue.play(track);

        return await interaction.followUp({ content: `⏱️ | Loading track **${track.title}**!` });
    }
});

client.login(process.env.DISCORD_TOKEN);
```

An explicit example:

```js
import { Client, Intents } from "discord.js";
import { Player, PlayerOptions } from "@bleah/discord-player";

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES]
});

/**
 * Player configuration example
 */
const player = new Player(client, {
  // -----------------------------
  // Voice / lifecycle behavior
  // -----------------------------
  /** Leave the voice channel automatically when the queue finishes. */
  leaveOnEnd: true,

  /** Wait (ms) after the queue ends before leaving (lets users enqueue quickly). */
  leaveOnEndCooldown: 1500,

  /** Leave when queue.stop() is called. */
  leaveOnStop: true,

  /** Leave if the voice channel becomes empty. */
  leaveOnEmpty: true,

  /** Wait (ms) before leaving on empty, in case users rejoin. */
  leaveOnEmptyCooldown: 30000,

  /** Self-deafen the bot to avoid feedback and reduce CPU usage. */
  autoSelfDeaf: true,

  // -----------------------------
  // Playback & UX
  // -----------------------------
  /** Initial playback volume (0–100). */
  initialVolume: 100,

  /** Delay (ms) before starting playback to allow buffer to fill. */
  bufferingTimeout: 3000,

  /**
   * If true, when a Spotify track has no direct stream,
   * the player tries to find a YouTube equivalent.
   */
  spotifyBridge: true,

  /** Disable software volume control (keeps raw audio level). */
  disableVolume: false,

  /**
   * Smooth volume transitions (0..1). Small values (0.05–0.1)
   * add a short fade instead of an instant jump. 0/undefined disables it.
   */
  volumeSmoothness: 0.08,

  // -----------------------------
  // yt-dlp network / auth hints
  // -----------------------------
  /**
   * Network/auth hints forwarded to the yt-dlp bridge and (where possible) FFmpeg.
   * Use only what you need. Cookies sources are mutually exclusive.
   */
  ytdlpAgent: {
    /**
     * Global proxy (http/https/socks). Example: "http://user:pass@host:8080"
     * Leave undefined if you don't need a proxy.
     */
    proxyUri: undefined,

    /**
     * Pull cookies from a local browser profile ('chrome' | 'brave' | 'firefox' | 'edge').
     * Helpful for age-gated or region-locked content.
     */
    cookiesFromBrowser: undefined,

    /** Path to Netscape cookies.txt (used by yt-dlp --cookies). */
    cookiesFile: undefined,

    /** Path to cookies.json (array). Will be auto-converted to cookies.txt. */
    cookiesJsonPath: undefined,

    /**
     * Raw 'Cookie' header (takes priority over 'cookies' when building request headers).
     * If no other cookie sources are provided (browser/file/json),
     * it will also be used to generate a temporary cookies.txt file (fallback)
     * and is passed as an HTTP header.
     */
    cookiesHeader: undefined,

    /**
     * Cookies - supported in two main modes:
     *
     * (A) SIMPLE PAIRS / HEADER-LIKE  
     *   - string: "SID=xxx; HSID=yyy"  
     *   - object: { SID: "xxx", HSID: "yyy" }  
     *   - array: [{ name: "SID", value: "xxx" }, ...]  
     *   Behavior: a 'Cookie:' header is always forwarded to yt-dlp/FFmpeg, and a temporary
     *   synthetic cookies.txt (with expires=0) is auto-generated to help bypass age-restricted videos.
     *   These sessions are short-lived (hours to a few days) since no 'expires' or domain/path metadata is preserved.
     *
     * (B) FULL COOKIE ARRAY (persistent; preserves domain/path/secure/expires metadata)  
     *   - array: [{ name, value, domain, path, secure, expires }, ...]  
     *   Behavior: converted into a Netscape cookies.txt file preserving all attributes
     *   (equivalent to what yt-dlp expects from '--cookies'). These sessions persist according
     *   to each cookie’s own 'expires' timestamp — often days, weeks, or months.
     *
     * NOTES:
     *  - JSON strings like "[{...}]" or "{...}" are NOT supported — use a real JS array instead.
     *  - If 'cookiesFromBrowser', 'cookiesFile', or 'cookiesJsonPath' are provided, they take priority.
     *  - A plain object like '{ SID: "...", HSID: "..." }' is treated as a simple map → mode (A).
     *  - Priority (highest -> lowest):
     *      cookiesFromBrowser > cookiesFile > cookiesJsonPath > full array > header/simple pairs
     */
    cookies: undefined,

    /** If true, do not set a browser-like default User-Agent.
     * Defaults to 'false'.
     */
    noUA: false,

    /** Force IPv4 in yt-dlp requests (can help with some networks/ISPs).
     * Defaults to 'false'.
     */
    forceIPv4: false,

    /**
     * If 'true', attempt to auto-detect a local browser profile (Chrome/Brave/Edge/Firefox)
     * and instruct yt-dlp to use its cookies (equivalent to '--cookies-from-browser').
     * - Useful to reuse an existing signed-in session without manually exporting cookies.
     * - If detection fails or the option is 'false', no browser profile will be used.
     * Defaults to 'true'.
     */
    autoCookiesFromBrowser: true
  },

  // -----------------------------
  // Advanced hook (optional)
  // -----------------------------
  /**
   * Runs before a stream is created. If you return a Readable,
   * the player uses it instead of the default pipeline.
   */
  onBeforeCreateStream: async (track, source, queue) => undefined
});

client.login(process.env.DISCORD_TOKEN);
```

## Supported websites

By default, @bleah/discord-player supports **YouTube**, **Spotify**, **SoundCloud** and **Attachment Links** streams only.

### Optional dependencies

Discord Player provides an **Extractor API** that enables you to use your custom stream extractor with it.

## Examples of bots made with Discord Player

These bots are made by the community, they can help you build your own!

* **[Tau](https://github.com/dfxphoenix/Tau)** by [dFxPhoeniX](https://github.com/dfxphoenix)

## Advanced

### Smooth Volume

Discord Player will by default try to implement this. If smooth volume does not work, you need to add this line at the top of your main file:

```js
// CJS
require("@bleah/discord-player/smoothVolume");

// ESM
import "@bleah/discord-player/smoothVolume"
```

> ⚠️ Make sure that line is situated at the **TOP** of your **main** file.

### Use cookies

```js
const player = new Player(client, {
    ytdlpAgent: {
        cookies: [
          {
            domain: ".youtube.com",
            expirationDate: 1234567890,
            hostOnly: false,
            httpOnly: true,
            name: "LOGIN_INFO",
            path: "/",
            sameSite: "no_restriction",
            secure: true,
            session: false,
            value: "---xxx---",
          },
          "...",
        ]
    }
});
```

### Use custom proxy

```js
const player = new Player(client, {
    ytdlpAgent: {
        proxyUri: 'http://user:password@127.0.0.1:80'
    }
});
```

### Use custom proxy with cookies

```js
const player = new Player(client, {
    ytdlpAgent: {
        proxyUri: 'http://user:password@127.0.0.1:80',
        cookies: [
          {
            domain: ".youtube.com",
            expirationDate: 1234567890,
            hostOnly: false,
            httpOnly: true,
            name: "LOGIN_INFO",
            path: "/",
            sameSite: "no_restriction",
            secure: true,
            session: false,
            value: "---xxx---",
          },
          "...",
        ]
    }
});
```

> You may also create a simple proxy server and forward requests through it.
> See **[https://github.com/http-party/node-http-proxy](https://github.com/http-party/node-http-proxy)** for more info.

#### How to get cookies

- Install [Get cookies.txt LOCALLY](https://github.com/kairi003/Get-cookies.txt-LOCALLY) extension for your browser.
- Go to [YouTube](https://www.youtube.com/).
- Log in to your account. (You should use a new account for this purpose)
- Change the export format to JSON.
- Click on the extension icon and click "Copy" button.
- Your cookie will be added to your clipboard and paste it into your code.

### Custom stream Engine

Discord Player by default uses **[ytdlp-nodejs](https://github.com/iqbal-rashed/ytdlp-nodejs)** for youtube and some other extractors for other sources.
If you need to modify this behavior without touching extractors, you need to use `createStream` functionality of discord player.
Here's an example on how you can use **[play-dl](https://npmjs.com/package/play-dl)** to download youtube streams instead of using ytdlp-nodejs.

```js
const playdl = require("play-dl");

// other code
const queue = player.createQueue(..., {
    ...,
    async onBeforeCreateStream(track, source, _queue) {
        // only trap youtube source
        if (source === "youtube") {
            // track here would be youtube track
            return (await playdl.stream(track.url, { discordPlayerCompatibility : true })).stream;
            // we must return readable stream or void (returning void means telling @bleah/discord-player to look for default extractor)
        }
    }
});
```

`<Queue>.onBeforeCreateStream` is called before actually downloading the stream. It is a different concept from extractors, where you are **just** downloading
streams. `source` here will be a video source. Streams from `onBeforeCreateStream` are then piped to `FFmpeg` and finally sent to Discord voice servers.
