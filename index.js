const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once("ready", () => {
  console.log(`Titan Market Bot online jako ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // !ping
  if (message.content === "!ping") {
    message.reply("🏓 Pong! Titan Market Bot działa!");
  }

  // !ogloszenie TEKST
  if (message.content.startsWith("!ogloszenie ")) {
    const tekst = message.content.slice(12);

    const embed = new EmbedBuilder()
      .setTitle("📢 TITAN MARKET")
      .setDescription(tekst)
      .setFooter({ text: "Titan Market • Oficjalne ogłoszenie" })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
});

client.on("guildMemberAdd", async (member) => {
  const channelId = process.env.WELCOME_CHANNEL_ID;

  if (!channelId) return;

  const channel = member.guild.channels.cache.get(channelId);

  if (!channel) return;

  channel.send(
    `👋 Witaj ${member} na **Titan Market**!\n\n` +
    `💎 Titany od 1 zł\n` +
    `🎫 Jeśli potrzebujesz pomocy, napisz na ticketach.`
  );
});

client.login(process.env.TOKEN);
