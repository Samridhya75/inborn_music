const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const { DisTube,isVoiceChannelEmpty } = require("distube");
const { SpotifyPlugin } = require("@distube/spotify");
const { YouTubePlugin } = require("@distube/youtube");
const { token } = require("./config.json");
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

  queue: (message, args) => {
    const queue = distube.getQueue(message.guild.id);
    if (!queue) {
      return message.reply({
        embeds: [createErrorEmbed("Nothing is playing right now!")],
      });
    }

    // Parse page number if provided
    const page = parseInt(args[0]) || 1;
    const songsPerPage = 10;
    const startIndex = (page - 1) * songsPerPage;
    const endIndex = startIndex + songsPerPage;
    const totalPages = Math.ceil(queue.songs.length / songsPerPage);

    // Validate page number
    if (page < 1 || page > totalPages) {
      return message.reply({
        embeds: [
          createErrorEmbed(
            `Invalid page number! Please use a number between 1 and ${totalPages}.`
          ),
        ],
      });
    }

    const songsToShow = queue.songs.slice(startIndex, endIndex);

    const q = songsToShow.map((song, i) => {
      const actualIndex = startIndex + i;
      const playlistInfo = song.playlist ? ` 📋` : "";

      if (actualIndex === 0) {
        return `**🎵 Now Playing:** [${song.name}](${
          song.url
        }) - \`${formatDuration(song.duration)}\`${playlistInfo}`;
      } else {
        return `**${actualIndex + 1}.** [${song.name}](${
          song.url
        }) - \`${formatDuration(song.duration)}\`${playlistInfo}`;
      }
    });

    const embed = new EmbedBuilder()
      .setTitle("🎵 Current Queue")
      .setDescription(q.join("\n"))
      .setColor(EMBED_COLOR)
      .setFooter({
        text: `Page ${page}/${totalPages} | Total songs: ${queue.songs.length} | Use %skipto <number> to skip to a specific song`,
      })
      .setTimestamp();

    // Add current playlist info if available
    const currentSong = queue.songs[0];
    if (currentSong.playlist) {
      embed.addFields({
        name: "📋 Current Playlist",
        value: `[${currentSong.playlist.name}](${currentSong.playlist.url})`,
        inline: true,
      });
    }

    // Add navigation info for multiple pages
    if (totalPages > 1) {
      embed.addFields({
        name: "📄 Navigation",
        value: `Use \`%queue <page>\` to view other pages (1-${totalPages})`,
        inline: false,
      });
    }

    // Add playlist statistics
    const playlistSongs = queue.songs.filter((song) => song.playlist);
    if (playlistSongs.length > 0) {
      const playlistCount = [
        ...new Set(playlistSongs.map((song) => song.playlist?.name)),
      ].length;
      embed.addFields({
        name: "📊 Playlist Info",
        value: `${playlistSongs.length} songs from ${playlistCount} playlist(s)`,
        inline: true,
      });
    }

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
        },
        {
          name: `${PREFIX}skipto <number>`,
          value: "Skip forward to a specific song in playlist. Only goes forward!!",
          inline: true
        }
      )
      .setColor(EMBED_COLOR)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
  skipto: async (message, args) => {
    // Check if user is in a voice channel
    if (!checkVoiceChannel(message)) return;

    // Check if there's a queue
    const queue = distube.getQueue(message.guild.id);
    if (!queue) {
      return message.reply({
        embeds: [createErrorEmbed("Nothing is playing right now!")],
      });
    }

    // Check if position argument is provided
    if (!args[0]) {
      return message.reply({
        embeds: [
          createErrorEmbed(
            "Please provide a position number! Use `%queue` to see song positions."
          ),
        ],
      });
    }

    // Parse the position number
    const position = parseInt(args[0]);

    // Validate the position number
    if (isNaN(position) || position < 1) {
      return message.reply({
        embeds: [
          createErrorEmbed(
            "Please provide a valid position number (1 or higher)!"
          ),
        ],
      });
    }

    // Check if position exists in queue (position 1 is currently playing)
    if (position > queue.songs.length) {
      return message.reply({
        embeds: [
          createErrorEmbed(
            `There are only ${queue.songs.length} songs in the queue! Use \`%queue\` to see all songs.`
          ),
        ],
      });
    }

    // Check if trying to skip to currently playing song
    if (position === 1) {
      return message.reply({
        embeds: [
          createErrorEmbed(
            "This song is already playing! Use `%skip` to skip to the next song."
          ),
        ],
      });
    }

    try {
      // Get the target song info before skipping
      const targetSong = queue.songs[position - 1];

      // Send loading message for longer operations
      const loadingEmbed = new EmbedBuilder()
        .setTitle("⏳ Processing...")
        .setDescription(`Skipping to position ${position}...`)
        .setColor("#ffff00")
        .setTimestamp();

      const loadingMsg = await message.reply({ embeds: [loadingEmbed] });

      // Use DisTube's jump method if available (more efficient)
      if (typeof distube.jump === "function") {
        await distube.jump(message.guild.id, position - 1);
      } else {
        // Fallback: Skip multiple songs to reach the target position
        const songsToSkip = position - 1;

        // Skip songs one by one with small delays to prevent rate limiting
        for (let i = 0; i < songsToSkip; i++) {
          if (queue.songs.length > 1) {
            await distube.skip(message.guild.id);
            // Small delay to prevent overwhelming the API
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      }

      // Send success message with detailed info
      const embed = new EmbedBuilder()
        .setTitle("⏭️ Skipped to Song")
        .setDescription(`Now playing: [${targetSong.name}](${targetSong.url})`)
        .addFields(
          { name: "Position", value: `${position}`, inline: true },
          {
            name: "Duration",
            value: formatDuration(targetSong.duration),
            inline: true,
          },
          {
            name: "Requested by",
            value: targetSong.user.username,
            inline: true,
          }
        )
        .setThumbnail(targetSong.thumbnail)
        .setColor(EMBED_COLOR)
        .setTimestamp();

      // Check if song is from a playlist
      if (targetSong.playlist) {
        embed.addFields({
          name: "📋 From Playlist",
          value: `[${targetSong.playlist.name}](${targetSong.playlist.url})`,
          inline: false,
        });
      }

      await loadingMsg.edit({ embeds: [embed] });
    } catch (error) {
      console.error("Skip to command error:", error);
      message.reply({
        embeds: [
          createErrorEmbed(
            "An error occurred while trying to skip to that song. Please try again."
          ),
        ],
      });
    }
  },
};

// Event handlers
client.on("ready", () => {
  console.log(`${client.user.tag} is online!`);
  client.user.setPresence({
    activities: [
      {
        name: "🎶 %play for music ",
        type: 4,
      },
    ],
    status: "online",
  });
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

client.on("voiceStateUpdate", (oldState) => {
  if (!oldState?.channel) return;
  const queue = distube.getQueue(oldState.guild);
  if (!queue) return;
  if (isVoiceChannelEmpty(oldState)) {
    queue.stop();
    queue.textChannel.send({
      embeds: [createEmbed("Queue cleared","There is no one in the channel!")]
    });
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

distube.on("error", (queue, e) => {
  console.error("DisTube error:", e);
  queue.textChannel.send({
    embeds: [createErrorEmbed("An error occurred with the music player.")],
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
client.login(process.env.TOKEN || token);
