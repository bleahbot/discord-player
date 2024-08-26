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

### Install FFmpeg
- Official FFMPEG Website: **[https://www.ffmpeg.org/download.html](https://www.ffmpeg.org/download.html)**

- Node Module (FFMPEG): **[https://npmjs.com/package/ffmpeg-static](https://npmjs.com/package/ffmpeg-static)**

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

### Use PoToken

The **poToken** can be used to avoid bot errors and must be specified with visitorData. If you need to obtain poToken or visitorData, please use one of the following repositories to generate them.

1. https://github.com/YunzheZJU/youtube-po-token-generator (recommended)
2. https://github.com/iv-org/youtube-trusted-session-generator
3. https://github.com/fsholehan/scrape-youtube

#### Example

```js
const player = new Player(client, {
    ytdlAgent: {
        poToken: "",
        visitorData: ""
    }
});
```

### Use OAuth2

These can be used to avoid age restrictions and bot errors. See below for instructions on how to use them. If you need to obtain OAuth2 tokens, please use one of the following repositories to generate them.

1. https://github.com/imputnet/cobalt

#### Cobalt Token generation

```bash
git clone https://github.com/imputnet/cobalt
cd cobalt/api/src
npm install -g pnpm
pnpm install
npm run token:youtube
```

#### Example

```js
const player = new Player(client, {
    ytdlAgent: {
        oauth2: {
            accessToken: "",
            refreshToken: "",
            expiryDate: "yyyy-MM-ddThh-mm-ssZ"
        }
    }
});
```

> ⚠️ Be sure to generate tokens with accounts that can be banned, as accounts may be banned.
> The specified OAuth2 token is automatically updated, so you do not need to update it yourself.

### Use custom proxy

```js
const player = new Player(client, {
    ytdlAgent: {
        proxyUri: "my.proxy.server"
    }
});
```

### Use custom proxy with PoToken and OAuth2

```js
const player = new Player(client, {
    ytdlAgent: {
        proxyUri: "my.proxy.server",
        poToken: "",
        visitorData: "",
        oauth2: {
            accessToken: "",
            refreshToken: "",
            expiryDate: "yyyy-MM-ddThh-mm-ssZ"
        }
    }
});
```

> You may also create a simple proxy server and forward requests through it.
> See **[https://github.com/http-party/node-http-proxy](https://github.com/http-party/node-http-proxy)** for more info.

### Custom stream Engine

Discord Player by default uses **[@ybd-project/ytdl-core](https://github.com/ybd-project/ytdl-core)** for youtube and some other extractors for other sources.
If you need to modify this behavior without touching extractors, you need to use `createStream` functionality of discord player.
Here's an example on how you can use **[play-dl](https://npmjs.com/package/play-dl)** to download youtube streams instead of using @ybd-project/ytdl-core.

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
