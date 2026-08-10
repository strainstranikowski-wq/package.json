const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} = require("discord.js");

const http = require("http");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Serwer dla Rendera
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Titan Market Bot działa!");
});

server.listen(process.env.PORT || 10000, () => {
  console.log("Serwer HTTP działa.");
});

client.once("ready", () => {
  console.log(`Titan Market Bot online jako ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!ping") {
    message.reply("🏓 Pong! Titan Market Bot działa!");
  }

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
