const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { DisTube } = require("distube");
const { SpotifyPlugin } = require("@distube/spotify");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const { YouTubePlugin } = require("@distube/youtube");
const fs = require("fs");
const { isVoiceChannelEmpty } = require("distube");
require('dotenv').config();

const TOKEN = process.env.TOKEN;

const PREFIX = "%";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
  ],
});

const distube = new DisTube(client, {
  plugins: [
    new SpotifyPlugin(),
    new YouTubePlugin({
      cookies: JSON.parse(fs.readFileSync("cookies.json")),
    }),
  ],
});

client.once("ready", () => {
  console.log(`${client.user.tag} is online!`);

  client.user.setPresence({
    activities: [
      {
        name: "🎶 %play for music",
        type: 4,
      },
    ],
    status: "online",
  });
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (command === "play") {
    const query = args.join(" ");
    if (!query)
      return message.channel.send("Please provide a song name or link!");

    const userVoiceChannel = message.member.voice.channel;

    if (!userVoiceChannel) {
      return message.channel.send(
        "❌ You must be in a voice channel to play music!"
      );
    }

    if(!userVoiceChannel.joinable || !userVoiceChannel.speakable){
        return message.channel.send(`❌ I don't have permission to join or speak in your voice channel :(`);
    }

    try {
      distube.play(message.member.voice.channel, query, {
        textChannel: message.channel,
        member: message.member,
      });
    } catch (err) {
      console.error("Error playing music: ", err);
      message.channel.send("Error playing music 🔴");
    }
  }

  if (command === "skip") {
    distube.skip(message);
    message.channel.send(`Skipped to next song ✅.`);
  }
  if (command === "stop") {
    distube.stop(message);
    message.channel.send(`Stopped the queue 🔴.`);
  }
  if (command === "pause") {
    distube.pause(message);
    message.channel.send(`Paused the queue ⏸️.`);
  }
  if (command === "resume") {
    distube.resume(message);
    message.channel.send(`Resumed the queue ⏯️.`);
  }
  if (command === "shuffle") {
    const queue = distube.getQueue(message);
    if(!queue) return message.channel.send('❌ Nothing is playing!!');

    queue.shuffle();
    message.channel.send('🔀 Queue shuffled');
  }
  if (command === "volume") {
    const vol = parseInt(args[0]);
    if (isNaN(vol)) return message.channel.send("Please enter a number.");
    distube.setVolume(message, vol);
  }

  if (command === "queue") {
    const queue = distube.getQueue(message);
    if (!queue) return message.channel.send("Nothing is playing!");
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("Current Queue")
      .setDescription(
        queue.songs
          .map(
            (song, i) =>
              `**${i + 1}.** ${song.name} - \`${song.formattedDuration}\``
          )
          .join("\n")
      )
      .setFooter({
        text: `Volume: ${queue.volume}% | Loop: ${
          queue.repeatMode ? "On" : "Off"
        }`,
      });

    message.channel.send({ embeds: [embed] });
  }
});

//pause queue if there is no user in channel and resume when there is one
client.on("voiceStateUpdate", (oldState) => {
  if (!oldState?.channel) return;
  const queue = this.queues.get(oldState);
  if (!queue) return;
  if (isVoiceChannelEmpty(oldState)) {
    queue.pause();
    queue.textChannel.send(
      `Queue paused because there is no one in the channel.`
    );
  } else if (queue.paused) {
    queue.resume();
  }
});

// Embed for now playing
distube
  .on("playSong", (queue, song) => {
    const embed = new EmbedBuilder()
      .setTitle("🎶 Now Playing")
      .setDescription(`[${song.name}](${song.url})`)
      .addFields({
        name: "Duration",
        value: song.formattedDuration,
        inline: true,
      })
      .setThumbnail(song.thumbnail)
      .setFooter({
        text: `Requested by ${song.user.tag}`,
        iconURL: song.user.displayAvatarURL(),
      });
    queue.textChannel.send({ embeds: [embed] });
  })
  .on("addSong", (queue, song) =>
    queue.textChannel.send(`✅ Added: \`${song.name}\` - \`${song.formattedDuration}\``)
    )
  .on("finish", (queue) => queue.textChannel.send("✅ Queue finished! "))
  .on('error', (e,queue) => {
    console.log(e);
    queue.textChannel.send(`An error encountered !!`);
  });


client.login(TOKEN);
