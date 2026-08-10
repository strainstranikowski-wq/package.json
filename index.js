const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ChannelType
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

// Serwer dla Render
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

// !ping
// !ogloszenie TEKST
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

  // !ticket
  if (message.content === "!ticket") {
    const embed = new EmbedBuilder()
      .setTitle("🎫 TITAN MARKET — TICKET")
      .setDescription(
        "Potrzebujesz pomocy?\n\n" +
        "Kliknij przycisk poniżej, aby utworzyć prywatny ticket."
      )
      .setFooter({ text: "Titan Market" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("create_ticket")
        .setLabel("🎫 Otwórz ticket")
        .setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }
});

// Obsługa przycisków
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "create_ticket") {
    const existing = interaction.guild.channels.cache.find(
      channel => channel.name === `ticket-${interaction.user.id}`
    );

    if (existing) {
      return interaction.reply({
        content: `❌ Masz już otwarty ticket: ${existing}`,
        ephemeral: true
      });
    }

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.id}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle("🎫 TICKET — TITAN MARKET")
      .setDescription(
        `Witaj ${interaction.user}!\n\n` +
        "Opisz tutaj, czego potrzebujesz. Administracja odpowie tak szybko, jak będzie mogła."
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("🔒 Zamknij ticket")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `${interaction.user}`,
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content: `✅ Ticket został utworzony: ${channel}`,
      ephemeral: true
    });
  }

  if (interaction.customId === "close_ticket") {
    await interaction.reply("🔒 Ticket zostanie zamknięty za 3 sekundy...");

    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 3000);
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
    `🎫 Potrzebujesz pomocy? Utwórz ticket.`
  );
});

client.login(process.env.TOKEN);
