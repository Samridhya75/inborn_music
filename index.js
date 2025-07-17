const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const { DisTube } = require("distube");
const { SpotifyPlugin } = require("@distube/spotify");
const { YouTubePlugin } = require("@distube/youtube");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Initialize DisTube
const distube = new DisTube(client, {
  plugins: [new SpotifyPlugin(), new YouTubePlugin()],
});

// Bot configuration
const PREFIX = "%";
const EMBED_COLOR = "#0099ff";

// Utility functions
const createEmbed = (title, description, color = EMBED_COLOR) => {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
};

const createErrorEmbed = (error) => {
  return createEmbed("❌ Error", error, "#ff0000");
};

const createSuccessEmbed = (message) => {
  return createEmbed("✅ Success", message, "#00ff00");
};

const formatDuration = (duration) => {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const checkVoiceChannel = (message) => {
  if (!message.member.voice.channel) {
    message.reply({
      embeds: [
        createErrorEmbed(
          "You need to be in a voice channel to use this command!"
        ),
      ],
    });
    return false;
  }
  return true;
};

const checkBotPermissions = (message) => {
  const permissions = message.member.voice.channel.permissionsFor(
    message.guild.members.me
  );
  if (
    !permissions.has([
      PermissionsBitField.Flags.Connect,
      PermissionsBitField.Flags.Speak,
    ])
  ) {
    message.reply({
      embeds: [
        createErrorEmbed(
          "I need permissions to join and speak in your voice channel!"
        ),
      ],
    });
    return false;
  }
  return true;
};

// Command handlers
const commands = {
  play: async (message, args) => {
    if (!checkVoiceChannel(message)) return;
    if (!checkBotPermissions(message)) return;

    const query = args.join(" ");
    if (!query) {
      return message.reply({
        embeds: [createErrorEmbed("Please provide a song name or URL!")],
      });
    }

    try {
      await distube.play(message.member.voice.channel, query, {
        textChannel: message.channel,
        member: message.member,
      });
    } catch (error) {
      console.error("Play command error:", error);
      message.reply({
        embeds: [
          createErrorEmbed("An error occurred while trying to play the song."),
        ],
      });
    }
  },

  pause: (message) => {
    const queue = distube.getQueue(message.guild.id);
    if (!queue) {
      return message.reply({
        embeds: [createErrorEmbed("Nothing is playing right now!")],
      });
    }

    try {
      distube.pause(message.guild.id);
      message.reply({ embeds: [createSuccessEmbed("⏸️ Paused the music!")] });
    } catch (error) {
      console.error("Pause command error:", error);
      message.reply({
        embeds: [
          createErrorEmbed("An error occurred while pausing the music."),
        ],
      });
    }
  },

  resume: (message) => {
    const queue = distube.getQueue(message.guild.id);
    if (!queue) {
      return message.reply({
        embeds: [createErrorEmbed("Nothing is playing right now!")],
      });
    }

    try {
      distube.resume(message.guild.id);
      message.reply({ embeds: [createSuccessEmbed("▶️ Resumed the music!")] });
    } catch (error) {
      console.error("Resume command error:", error);
      message.reply({
        embeds: [
          createErrorEmbed("An error occurred while resuming the music."),
        ],
      });
    }
  },

  skip: (message) => {
    const queue = distube.getQueue(message.guild.id);
    if (!queue) {
      return message.reply({
        embeds: [createErrorEmbed("Nothing is playing right now!")],
      });
    }

    try {
      distube.skip(message.guild.id);
      message.reply({
        embeds: [createSuccessEmbed("⏭️ Skipped the current song!")],
      });
    } catch (error) {
      console.error("Skip command error:", error);
      message.reply({
        embeds: [
          createErrorEmbed("An error occurred while skipping the song."),
        ],
      });
    }
  },

  stop: (message) => {
    const queue = distube.getQueue(message.guild.id);
    if (!queue) {
      return message.reply({
        embeds: [createErrorEmbed("Nothing is playing right now!")],
      });
    }

    try {
      distube.stop(message.guild.id);
      message.reply({
        embeds: [
          createSuccessEmbed("⏹️ Stopped the music and cleared the queue!"),
        ],
      });
    } catch (error) {
      console.error("Stop command error:", error);
      message.reply({
        embeds: [
          createErrorEmbed("An error occurred while stopping the music."),
        ],
      });
    }
  },

  shuffle: (message) => {
    const queue = distube.getQueue(message.guild.id);
    if (!queue) {
      return message.reply({
        embeds: [createErrorEmbed("Nothing is playing right now!")],
      });
    }

    try {
      distube.shuffle(message.guild.id);
      message.reply({ embeds: [createSuccessEmbed("🔀 Shuffled the queue!")] });
    } catch (error) {
      console.error("Shuffle command error:", error);
      message.reply({
        embeds: [
          createErrorEmbed("An error occurred while shuffling the queue."),
        ],
      });
    }
  },

  volume: (message, args) => {
    const queue = distube.getQueue(message.guild.id);
    if (!queue) {
      return message.reply({
        embeds: [createErrorEmbed("Nothing is playing right now!")],
      });
    }

    const volume = parseInt(args[0]);
    if (isNaN(volume) || volume < 0 || volume > 100) {
      return message.reply({
        embeds: [
          createErrorEmbed("Please provide a valid volume between 0 and 100!"),
        ],
      });
    }

    try {
      distube.setVolume(message.guild.id, volume);
      message.reply({
        embeds: [createSuccessEmbed(`🔊 Set volume to ${volume}%`)],
      });
    } catch (error) {
      console.error("Volume command error:", error);
      message.reply({
        embeds: [
          createErrorEmbed("An error occurred while changing the volume."),
        ],
      });
    }
  },

  queue: (message) => {
    const queue = distube.getQueue(message.guild.id);
    if (!queue) {
      return message.reply({
        embeds: [createErrorEmbed("Nothing is playing right now!")],
      });
    }

    const q = queue.songs
      .map(
        (song, i) =>
          `${i === 0 ? "**Now Playing:**" : `${i}.`} [${song.name}](${
            song.url
          }) - \`${formatDuration(song.duration)}\``
      )
      .slice(0, 10);

    const embed = new EmbedBuilder()
      .setTitle("🎵 Current Queue")
      .setDescription(q.join("\n"))
      .setColor(EMBED_COLOR)
      .setFooter({ text: `Total songs: ${queue.songs.length}` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },

  nowplaying: (message) => {
    const queue = distube.getQueue(message.guild.id);
    if (!queue) {
      return message.reply({
        embeds: [createErrorEmbed("Nothing is playing right now!")],
      });
    }

    const song = queue.songs[0];
    const embed = new EmbedBuilder()
      .setTitle("🎵 Now Playing")
      .setDescription(`[${song.name}](${song.url})`)
      .addFields(
        {
          name: "Duration",
          value: formatDuration(song.duration),
          inline: true,
        },
        { name: "Requested by", value: song.user.username, inline: true },
        { name: "Volume", value: `${queue.volume}%`, inline: true }
      )
      .setThumbnail(song.thumbnail)
      .setColor(EMBED_COLOR)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },

  help: (message) => {
    const embed = new EmbedBuilder()
      .setTitle("🎵 Music Bot Commands")
      .setDescription("Here are all available commands:")
      .addFields(
        {
          name: `${PREFIX}play <song/url>`,
          value: "Play a song or add to queue",
          inline: false,
        },
        {
          name: `${PREFIX}pause`,
          value: "Pause the current song",
          inline: true,
        },
        {
          name: `${PREFIX}resume`,
          value: "Resume the paused song",
          inline: true,
        },
        { name: `${PREFIX}skip`, value: "Skip the current song", inline: true },
        {
          name: `${PREFIX}stop`,
          value: "Stop music and clear queue",
          inline: true,
        },
        { name: `${PREFIX}shuffle`, value: "Shuffle the queue", inline: true },
        {
          name: `${PREFIX}volume <0-100>`,
          value: "Change the volume",
          inline: true,
        },
        {
          name: `${PREFIX}queue`,
          value: "Show the current queue",
          inline: true,
        },
        {
          name: `${PREFIX}nowplaying`,
          value: "Show current song info",
          inline: true,
        }
      )
      .setColor(EMBED_COLOR)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
  leave: (message) => {
    // Check if user is in a voice channel
    if (!message.member.voice.channel) {
      return message.reply({
        embeds: [
          createErrorEmbed(
            "You need to be in a voice channel to use this command!"
          ),
        ],
      });
    }

    // Check if bot is in a voice channel
    if (!message.guild.members.me.voice.channel) {
      return message.reply({
        embeds: [createErrorEmbed("I am not connected to any voice channel!")],
      });
    }

    // Check if user is in the same voice channel as the bot
    if (
      message.member.voice.channel.id !==
      message.guild.members.me.voice.channel.id
    ) {
      return message.reply({
        embeds: [
          createErrorEmbed("You need to be in the same voice channel as me!"),
        ],
      });
    }

    try {
      // Get the current queue
      const queue = distube.getQueue(message.guild.id);

      if (queue) {
        // Stop the music and clear the queue
        distube.stop(message.guild.id);
      }

      // Leave the voice channel
      message.guild.members.me.voice.disconnect();

      message.reply({
        embeds: [createSuccessEmbed("👋 Successfully left the voice channel!")],
      });
    } catch (error) {
      console.error("Leave command error:", error);
      message.reply({
        embeds: [
          createErrorEmbed(
            "An error occurred while trying to leave the voice channel."
          ),
        ],
      });
    }
  },
};

// Event handlers
client.on("ready", () => {
  console.log(`${client.user.tag} is online!`);
  client.user.setActivity("music", { type: "LISTENING" });
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (commands[command]) {
    try {
      await commands[command](message, args);
    } catch (error) {
      console.error(`Error executing command ${command}:`, error);
      message.reply({
        embeds: [
          createErrorEmbed(
            "An unexpected error occurred while executing this command."
          ),
        ],
      });
    }
  }
});

// DisTube event handlers
distube.on("playSong", (queue, song) => {
  const embed = new EmbedBuilder()
    .setTitle("🎵 Now Playing")
    .setDescription(`[${song.name}](${song.url})`)
    .addFields(
      { name: "Duration", value: formatDuration(song.duration), inline: true },
      { name: "Requested by", value: song.user.username, inline: true }
    )
    .setThumbnail(song.thumbnail)
    .setColor(EMBED_COLOR)
    .setTimestamp();

  queue.textChannel.send({ embeds: [embed] });
});

distube.on("addSong", (queue, song) => {
  const embed = new EmbedBuilder()
    .setTitle("✅ Added to Queue")
    .setDescription(`[${song.name}](${song.url})`)
    .addFields(
      { name: "Duration", value: formatDuration(song.duration), inline: true },
      {
        name: "Position in queue",
        value: `${queue.songs.length}`,
        inline: true,
      }
    )
    .setThumbnail(song.thumbnail)
    .setColor("#00ff00")
    .setTimestamp();

  queue.textChannel.send({ embeds: [embed] });
});

distube.on("addList", (queue, playlist) => {
  const embed = new EmbedBuilder()
    .setTitle("📋 Playlist Added")
    .setDescription(
      `Added **${playlist.name}** playlist (${playlist.songs.length} songs) to queue`
    )
    .setColor("#00ff00")
    .setTimestamp();

  queue.textChannel.send({ embeds: [embed] });
});

distube.on("error", (textChannel, error) => {
  console.error("DisTube error:", error);
  textChannel.send({
    embeds: [createErrorEmbed("An error occurred with the music player.")],
  });
});

distube.on("empty", (queue) => {
  queue.textChannel.send({
    embeds: [
      createEmbed(
        "👋 Goodbye",
        "Voice channel is empty. Leaving the channel..."
      ),
    ],
  });
});

distube.on("finish", (queue) => {
  queue.textChannel.send({
    embeds: [createEmbed("🎵 Queue Finished", "All songs have been played!")],
  });
});

distube.on("disconnect", (queue) => {
  queue.textChannel.send({
    embeds: [
      createEmbed(
        "👋 Disconnected",
        "Bot disconnected from the voice channel."
      ),
    ],
  });
});

// Error handling
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

// Login
client.login(process.env.TOKEN);
