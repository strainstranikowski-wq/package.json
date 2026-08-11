const http = require("http");
const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  EmbedBuilder
} = require("discord.js");

// ===== RENDER =====
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.end("Titan Market ONLINE");
}).listen(PORT, "0.0.0.0");

// ===== BOT =====
const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const COLOR = 0x8B5CF6;
const ROLE = "✅ użytkownik";

const TITAN = "<:TitanHolo:1536522515092873319>";
const BLIK = "<:Blik:1536522618348380331>";
const PSC = "<:Psc:1536522696542781450>";
const MYPSC = "<:Mypsc:1536522757595078727>";

const invites = new Map();
const tickets = new Map();
const legit = new Map();
const daily = new Map();
const drops = new Map();
const giveaway = new Set();

const admin = m =>
  m.permissions.has(PermissionsBitField.Flags.Administrator);

const channel = (g, name) =>
  g.channels.cache.find(c =>
    c.name === name && c.type === ChannelType.GuildText
  );

const embed = (title, text) =>
  new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(title)
    .setDescription(text)
    .setFooter({ text: "💜 Titan Market" })
    .setTimestamp();

// ===== START =====
bot.once("ready", () => {
  console.log(`🤖 Titan Market ONLINE: ${bot.user.tag}`);
});

// ===== LOBBY =====
bot.on("guildMemberAdd", async member => {
  const lobby = channel(member.guild, "lobby");
  if (!lobby) return;

  let inviter = "Nie udało się ustalić";
  let count = 0;

  try {
    const old = invites.get(member.guild.id) || new Map();
    const now = await member.guild.invites.fetch();

    for (const i of now.values()) {
      const x = old.get(i.code) || 0;
      if ((i.uses || 0) > x) {
        inviter = i.inviter ? `<@${i.inviter.id}>` : "Nieznany";
        count = (invites.get(member.guild.id + "-" + i.inviter?.id) || 0) + 1;
        invites.set(member.guild.id + "-" + i.inviter?.id, count);
        break;
      }
    }

    invites.set(
      member.guild.id,
      new Map(now.map(i => [i.code, i.uses || 0]))
    );
  } catch {}

  lobby.send({
    embeds: [
      embed(
        "👋 NOWA OSOBA",
        `🎉 Witaj ${member}!\n\n` +
        `👤 Zaprosił: ${inviter}\n` +
        `📨 Zaproszenia: **${count}**`
      )
    ]
  });
});

// ===== KOMENDY =====
bot.on("messageCreate", async m => {
  if (m.author.bot || !m.guild) return;

  const c = m.content.trim();

  if (c === "!ping")
    return m.reply("🏓 **PONG! Bot działa!**");

  if (c === "!aktywuj")
    return m.reply("✅ **Titan Market Bot jest aktywny i działa!**");

  if (c === "!lobby") {
    if (!admin(m.member)) return m.reply("❌ Tylko administracja.");
    return m.channel.send({
      embeds: [
        embed(
          "👋 WITAJ NA TITAN MARKET",
          "💜 Profesjonalny sklep z Titanami\n\n" +
          "🛒 Zakupy\n🎫 Tickety\n⭐ Vouch / Legit\n🎁 Dropy\n🎉 Konkursy\n📨 Nagrody za zaproszenia"
        )
      ]
    });
  }

  if (c === "!weryfikacja") {
    const b = new ButtonBuilder()
      .setCustomId("verify")
      .setLabel("Zweryfikuj się")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success);

    return m.channel.send({
      embeds: [embed("🛡️ WERYFIKACJA", `Kliknij przycisk, aby otrzymać rolę **${ROLE}**.`)],
      components: [new ActionRowBuilder().addComponents(b)]
    });
  }

  if (c === "!cennik") {
    const b = new ButtonBuilder()
      .setCustomId("ticket")
      .setLabel("Otwórz ticket")
      .setEmoji("🎫")
      .setStyle(ButtonStyle.Primary);

    return m.channel.send({
      embeds: [
        embed(
          "🛒 CENNIK — CASE PARADISE",
          `${TITAN} **1 TITAN = 1 ZŁ**\n\n` +
          "💰 Kup dowolną ilość Titanów.\n\n" +
          "🎫 Kliknij przycisk, aby kupić."
        )
      ],
      components: [new ActionRowBuilder().addComponents(b)]
    });
  }

  if (c === "!platnosci")
    return m.channel.send({
      embeds: [
        embed(
          "💳 METODY PŁATNOŚCI",
          `${BLIK} **BLIK — 0%**\n\n${PSC} **PSC — 15%**\n\n${MYPSC} **MyPSC — 25%**`
        )
      ]
    });

  if (c === "!ticket") return ticketMenu(m.channel);

  if (c === "!zaproszenia") {
    const n = invites.get(m.guild.id + "-" + m.author.id) || 0;
    return m.reply(`📨 **Masz ${n} zaproszeń.**`);
  }

  if (c === "!legit")
    return m.channel.send({
      embeds: [
        embed(
          "⭐ CZY JESTEŚMY LEGIT?",
          "Prawdziwe potwierdzenia transakcji znajdziesz na kanale **vouch**."
        )
      ]
    });

  if (c.startsWith("!potwierdz")) {
    if (!admin(m.member)) return m.reply("❌ Tylko administracja.");
    const u = m.mentions.users.first();
    if (!u) return m.reply("❌ Użycie: `!potwierdz @klient 10`");

    const amount = Number(c.split(" ")[2]);
    if (!amount || amount < 1)
      return m.reply("❌ Podaj liczbę Titanów, np. `!potwierdz @klient 10`");

    legit.set(m.guild.id + "-" + u.id, amount);

    const b = new ButtonBuilder()
      .setCustomId(`legit:${u.id}`)
      .setLabel("Potwierdzam — LEGIT")
      .setEmoji("⭐")
      .setStyle(ButtonStyle.Success);

    return m.channel.send({
      embeds: [
        embed(
          "⭐ POTWIERDZENIE TRANSAKCJI",
          `👤 Klient: ${u}\n` +
          `🛒 Ilość: **${amount} Titanów**\n` +
          `💰 Kwota: **${amount} zł**\n\n` +
          "Jeżeli wszystko się zgadza, kliknij **LEGIT**."
        )
      ],
      components: [new ActionRowBuilder().addComponents(b)]
    });
  }

  if (c === "!daily") {
    const d = new Date().toLocaleDateString("pl-PL");
    return m.channel.send({
      embeds: [embed("📊 DAILY", `📅 ${d}\n\n🛒 Sprzedaż: **${daily.get(d) || 0}**`)]
    });
  }

  if (c === "!zakup") {
    if (!admin(m.member)) return m.reply("❌ Tylko administracja.");
    const d = new Date().toLocaleDateString("pl-PL");
    daily.set(d, (daily.get(d) || 0) + 1);
    return m.reply(`✅ Dodano zakup. DAILY: **${daily.get(d)}**`);
  }

  if (c === "!drop") {
    const last = drops.get(m.author.id) || 0;
    if (Date.now() - last < 7200000)
      return m.reply("⏳ Możesz użyć dropa ponownie za **2 godziny**.");

    drops.set(m.author.id, Date.now());

    const win = Math.random() < 0.05;
    return m.reply(
      win
        ? "🎉 **GRATULACJE! Wygrałeś nagrodę w dropie!**"
        : "😢 Tym razem się nie udało. Spróbuj za 2 godziny!"
    );
  }

  if (c === "!konkursy") {
    if (!admin(m.member)) return m.reply("❌ Tylko administracja.");
    giveaway.clear();

    const b = new ButtonBuilder()
      .setCustomId("giveaway")
      .setLabel("Weź udział")
      .setEmoji("🎉")
      .setStyle(ButtonStyle.Success);

    return m.channel.send({
      embeds: [embed("🎉 KONKURS", "Kliknij **Weź udział**, aby dołączyć!")],
      components: [new ActionRowBuilder().addComponents(b)]
    });
  }

  if (c === "!regulamin")
    return m.channel.send({
      embeds: [
        embed(
          "📜 REGULAMIN TITAN MARKET",
          "**§1 OGÓLNE**\n• Przestrzegaj regulaminu Discorda i serwera.\n• Szanuj innych.\n• Zakaz podszywania się.\n\n" +
          "**§2 KULTURA**\n• Zakaz wyzwisk, nękania i prowokacji.\n• Zakaz treści nienawistnych i NSFW poza przeznaczonymi miejscami.\n\n" +
          "**§3 SPAM / REKLAMY**\n• Zakaz spamu, floodu i reklam bez zgody.\n\n" +
          "**§4 BEZPIECZEŃSTWO**\n• Nie podawaj haseł ani kodów.\n• Nie klikaj podejrzanych linków.\n\n" +
          "**§5 TICKETY**\n• Jeden ticket na sprawę.\n• Zakaz fałszywych dowodów płatności.\n• Ticket zamyka administracja.\n\n" +
          "**§6 VOUCH / LEGIT**\n• Vouch tylko za prawdziwą transakcję.\n• Zakaz fałszywych opinii.\n\n" +
          "**§7 ZAPROSZENIA**\n• Zakaz nabijania zaproszeń dodatkowymi kontami.\n\n" +
          "**§8 KONKURSY / DROPY**\n• Zakaz używania multikont.\n• Oszustwa mogą skutkować dyskwalifikacją.\n\n" +
          "**§9 KARY**\n• Ostrzeżenie • Timeout • Kick • Ban\n\n" +
          "💜 Titan Market — baw się bezpiecznie i przestrzegaj zasad."
        )
      ]
    });
});

// ===== MENU TICKET =====
async function ticketMenu(ch) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticketmenu")
    .setPlaceholder("🎫 Wybierz kategorię")
    .addOptions(
      { label: "Zakup Titan", value: "zakup", emoji: "🛒" },
      { label: "Nagroda", value: "nagroda", emoji: "🎁" },
      { label: "Pomoc", value: "pomoc", emoji: "🛠️" },
      { label: "Współpraca", value: "wspolpraca", emoji: "🤝" }
    );

  ch.send({
    embeds: [
      embed(
        "🎫 TITAN MARKET — TICKETY",
        `${BLIK} BLIK — 0%\n${PSC} PSC — 15%\n${MYPSC} MyPSC — 25%\n\nWybierz kategorię poniżej.`
      )
    ],
    components: [new ActionRowBuilder().addComponents(menu)]
  });
}

// ===== INTERAKCJE =====
bot.on("interactionCreate", async i => {
  if (i.isButton() && i.customId === "verify") {
    const role = i.guild.roles.cache.find(r => r.name === ROLE);
    if (!role) return i.reply({ content: `❌ Brak roli **${ROLE}**.`, ephemeral: true });

    try {
      await i.member.roles.add(role);
      return i.reply({ content: "✅ Zweryfikowano!", ephemeral: true });
    } catch {
      return i.reply({ content: "❌ Bot nie może nadać roli. Przenieś rolę bota wyżej.", ephemeral: true });
    }
  }

  if (i.isButton() && i.customId === "ticket") {
    await ticketMenu(i.channel);
    return i.reply({ content: "🎫 Wybierz kategorię ticketu.", ephemeral: true });
  }

  if (i.isButton() && i.customId === "giveaway") {
    if (giveaway.has(i.user.id))
      return i.reply({ content: "⚠️ Już bierzesz udział!", ephemeral: true });

    giveaway.add(i.user.id);
    return i.reply({ content: "🎉 Dołączono do konkursu!", ephemeral: true });
  }

  if (i.isButton() && i.customId.startsWith("legit:")) {
    const id = i.customId.split(":")[1];
    if (i.user.id !== id)
      return i.reply({ content: "❌ Ten przycisk nie jest dla Ciebie.", ephemeral: true });

    const key = i.guild.id + "-" + id;
    const amount = legit.get(key);
    if (!amount)
      return i.reply({ content: "❌ Potwierdzenie wygasło.", ephemeral: true });

    const vouch = channel(i.guild, "vouch");
    if (!vouch)
      return i.reply({ content: "❌ Nie znaleziono kanału `vouch`.", ephemeral: true });

    await vouch.send({
      embeds: [
        embed(
          "⭐ NOWY VOUCH",
          `+rep **${i.user.username}**\n\n` +
          `🛒 **${amount} Titanów**\n` +
          `💰 **${amount} zł**\n\n` +
          "✅ Transakcja potwierdzona przez klienta."
        )
      ]
    });

    legit.delete(key);
    return i.reply({ content: "⭐ Vouch dodany!", ephemeral: true });
  }

  if (i.isStringSelectMenu() && i.customId === "ticketmenu") {
    const old = tickets.get(i.user.id);
    if (old)
      return i.reply({ content: `❌ Masz już ticket: ${old}`, ephemeral: true });

    const names = {
      zakup: "zakup-titan",
      nagroda: "nagroda",
      pomoc: "pomoc",
      wspolpraca: "wspolpraca"
    };

    try {
      const ch = await i.guild.channels.create({
        name: `🎫・${names[i.values[0]]}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: i.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: i.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory
            ]
          }
        ]
      });

      tickets.set(i.user.id, ch.id);

      const close = new ButtonBuilder()
        .setCustomId("close")
        .setLabel("Zamknij ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger);

      await ch.send({
        content: `${i.user}`,
        embeds: [
          embed(
            "🎫 TITAN MARKET",
            "💜 Witaj w tickecie!\n\n" +
            "🛒 Jeśli kupujesz Titany, napisz **ile chcesz kupić**.\n" +
            "💰 Cena zostanie obliczona automatycznie.\n\n" +
            "🔒 Ticket może zamknąć **tylko administracja**."
          )
        ],
        components: [new ActionRowBuilder().addComponents(close)]
      });

      return i.reply({ content: `✅ Ticket utworzony: ${ch}`, ephemeral: true });
    } catch {
      return i.reply({ content: "❌ Bot nie ma uprawnień do tworzenia kanałów.", ephemeral: true });
    }
  }

  if (i.isButton() && i.customId === "close") {
    if (!admin(i.member))
      return i.reply({ content: "❌ Tylko administracja może zamknąć ticket.", ephemeral: true });

    tickets.delete(
      [...tickets.entries()].find(x => x[1] === i.channel.id)?.[0]
    );

    await i.reply("🔒 Ticket zostanie zamknięty.");
    setTimeout(() => i.channel.delete().catch(() => {}), 2000);
  }
});

// ===== TOKEN =====
if (!process.env.TOKEN) {
  console.error("❌ BRAK TOKEN!");
  process.exit(1);
}

bot.login(process.env.TOKEN)
  .then(() => console.log("🔑 LOGOWANIE OK"))
  .catch(e => {
    console.error("❌ TOKENINVALID / BŁĄD LOGOWANIA:", e.message);
    process.exit(1);
  });
