const http = require("http");
const { Client, GatewayIntentBits } = require("discord.js");

// Render — port
const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Titan Market Bot działa!");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 PORT ${PORT} DZIAŁA`);
});

// Discord bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`🤖 BOT AKTYWNY: ${client.user.tag}`);
});

client.on("messageCreate", message => {
  if (message.author.bot) return;

  if (message.content === "!ping") {
    message.reply("🏓 PONG! BOT DZIAŁA!");
  }
});

if (!process.env.TOKEN) {
  console.error("❌ BRAK ZMIENNEJ TOKEN W RENDER!");
  process.exit(1);
}

client.login(process.env.TOKEN)
  .then(() => {
    console.log("🔑 LOGOWANIE DISCORD OK");
  })
  .catch(error => {
    console.error("❌ BŁĄD LOGOWANIA:");
    console.error(error);
    process.exit(1);
  });
