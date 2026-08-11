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
  EmbedBuilder,
} = require("discord.js");

// =====================================================
// TITAN MARKET BOT v2
// =====================================================

const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Titan Market Bot ONLINE");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Render PORT ${PORT} OK`);
});

// =====================================================
// DISCORD
// =====================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// =====================================================
// USTAWIENIA
// =====================================================

const PURPLE = 0x8B5CF6;

const VERIFIED_ROLE = "✅ użytkownik";

const TITAN = "<:TitanHolo:1536522515092873319>";
const BLIK = "<:Blik:1536522618348380331>";
const PSC = "<:Psc:1536522696542781450>";
const MYPSC = "<:Mypsc:1536522757595078727>";

const PRICE_PER_TITAN = 1;

// =====================================================
// DANE
// =====================================================

const inviteCache = new Map();
const inviteCounts = new Map();

const pendingLegit = new Map();

const dailyPurchases = new Map();
const dailyTitans = new Map();
const dailyMoney = new Map();

const giveawayUsers = new Set();

let dropLastUsed = 0;
const DROP_COOLDOWN = 2 * 60 * 60 * 1000;

// =====================================================
// FUNKCJE
// =====================================================

function isAdmin(member) {
  return member.permissions.has(
    PermissionsBitField.Flags.Administrator
  );
}

function getChannel(guild, name) {
  return guild.channels.cache.find(
    c =>
      c.name === name &&
      c.type === ChannelType.GuildText
  );
}

function money(amount) {
  return `${amount.toFixed(2).replace(".00", "")} zł`;
}

function today() {
  return new Date().toLocaleDateString("pl-PL");
}

function formatCooldown(ms) {
  const totalSeconds = Math.ceil(ms / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

// =====================================================
// READY
// =====================================================

client.once("ready", async () => {
  console.log(
    `🤖 TITAN MARKET ONLINE: ${client.user.tag}`
  );

  client.user.setPresence({
    activities: [
      {
        name: "Titan Market 💜",
        type: 0,
      },
    ],
    status: "online",
  });

  for (const guild of client.guilds.cache.values()) {
    try {
      const invites = await guild.invites.fetch();

      inviteCache.set(
        guild.id,
        new Map(
          invites.map(invite => [
            invite.code,
            {
              uses: invite.uses || 0,
              inviter: invite.inviter?.id,
            },
          ])
        )
      );
    } catch (error) {
      console.log(
        `⚠️ Nie można pobrać zaproszeń: ${guild.name}`
      );
    }
  }
});

// =====================================================
// LOBBY + ZAPROSZENIA
// =====================================================

client.on("guildMemberAdd", async member => {
  try {
    const guild = member.guild;

    const oldInvites =
      inviteCache.get(guild.id) || new Map();

    const newInvites =
      await guild.invites.fetch();

    let usedInvite = null;

    for (const invite of newInvites.values()) {
      const old = oldInvites.get(invite.code);

      if (
        invite.uses &&
        (!old || invite.uses > old.uses)
      ) {
        usedInvite = invite;
        break;
      }
    }

    inviteCache.set(
      guild.id,
      new Map(
        newInvites.map(invite => [
          invite.code,
          {
            uses: invite.uses || 0,
            inviter: invite.inviter?.id,
          },
        ])
      )
    );

    let inviteText =
      "📨 Zaproszenie: nie udało się ustalić.";

    if (usedInvite?.inviter) {
      const inviterId = usedInvite.inviter;

      const key =
        `${guild.id}-${inviterId}`;

      const count =
        (inviteCounts.get(key) || 0) + 1;

      inviteCounts.set(key, count);

      inviteText =
        `👤 Zaprosił: <@${inviterId}>\n` +
        `📨 Jego zaproszenia: **${count}**`;
    }

    const lobby = getChannel(guild, "lobby");

    if (!lobby) return;

    await lobby.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("👋 NOWY CZŁONEK")
          .setDescription(
            `🎉 Witamy ${member}!\n\n` +
            `👤 **${member.user.tag}** dołączył na **Titan Market**.\n\n` +
            `${inviteText}\n\n` +
            "💜 Miłego pobytu!"
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setTimestamp(),
      ],
    });
  } catch (error) {
    console.log("❌ Lobby:", error.message);
  }
});

// =====================================================
// KOMENDY
// =====================================================

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const cmd = message.content.trim();

  // ===================================================
  // PING
  // ===================================================

  if (cmd === "!ping") {
    return message.reply(
      "🏓 **PONG! Titan Market Bot działa!**"
    );
  }

  // ===================================================
  // START
  // ===================================================

  if (cmd === "!start") {
    if (!isAdmin(message.member)) {
      return message.reply(
        "❌ Tylko administracja może użyć `!start`."
      );
    }

    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("💜 TITAN MARKET — SYSTEM ONLINE")
          .setDescription(
            "╔════════════════════╗\n" +
            "      **TITAN MARKET**\n" +
            "╚════════════════════╝\n\n" +
            "🛒 **Cennik**\n" +
            "🎫 **Tickety**\n" +
            "💳 **Płatności**\n" +
            "⭐ **LEGIT / VOUCH**\n" +
            "🎁 **Drop**\n" +
            "🎉 **Konkursy**\n" +
            "📨 **Zaproszenia**\n" +
            "💰 **Daily**\n" +
            "🛡️ **Weryfikacja**\n" +
            "📜 **Regulamin**\n\n" +
            "━━━━━━━━━━━━━━━━━━━━\n\n" +
            "✅ **System Titan Market jest aktywny.**"
          )
          .setFooter({
            text: "Titan Market • Premium System",
          })
          .setTimestamp(),
      ],
    });

    return;
  }

  // ===================================================
  // LOBBY PANEL
  // ===================================================

  if (cmd === "!lobby") {
    if (!isAdmin(message.member)) {
      return message.reply("❌ Tylko administracja.");
    }

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("👋 WITAJ NA TITAN MARKET")
          .setDescription(
            "💜 **Witaj na oficjalnym serwerze Titan Market!**\n\n" +
            "🛒 Kupuj Titany\n" +
            "🎫 Korzystaj z ticketów\n" +
            "🎁 Bierz udział w dropach\n" +
            "🎉 Dołączaj do konkursów\n" +
            "⭐ Sprawdzaj nasze Vouchy\n\n" +
            "🛡️ Pamiętaj o weryfikacji!"
          )
          .setFooter({
            text: "Titan Market",
          }),
      ],
    });
  }

  // ===================================================
  // CENNIK
  // ===================================================

  if (cmd === "!cennik") {
    const button = new ButtonBuilder()
      .setCustomId("open_price_ticket")
      .setLabel("KUP TERAZ")
      .setEmoji("🎫")
      .setStyle(ButtonStyle.Primary);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("🛒 TITAN MARKET — CENNIK")
          .setDescription(
            `${TITAN} **1 TITAN = 1 ZŁ**\n\n` +
            "━━━━━━━━━━━━━━━━━━━━\n\n" +
            "💎 Kup dowolną ilość Titanów.\n\n" +
            "🎫 Kliknij **KUP TERAZ**, aby otworzyć ticket.\n\n" +
            "💜 Szybko • Bezpiecznie • Prosto"
          )
          .setFooter({
            text: "Titan Market • Sklep",
          }),
      ],
      components: [
        new ActionRowBuilder().addComponents(button),
      ],
    });
  }

  // ===================================================
  // PŁATNOŚCI
  // ===================================================

  if (cmd === "!platnosci") {
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("💳 METODY PŁATNOŚCI")
          .setDescription(
            `${BLIK} **BLIK — 0% PROWIZJI**\n\n` +
            `${PSC} **PSC — 15% PROWIZJI**\n\n` +
            `${MYPSC} **MYPSC — 25% PROWIZJI**\n\n` +
            "━━━━━━━━━━━━━━━━━━━━\n\n" +
            "🔒 Wszystkie płatności ustalaj wyłącznie w tickecie."
          ),
      ],
    });
  }

  // ===================================================
  // WERYFIKACJA
  // ===================================================

  if (cmd === "!weryfikacja") {
    const button = new ButtonBuilder()
      .setCustomId("verify_user")
      .setLabel("ZWERYFIKUJ SIĘ")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("🛡️ WERYFIKACJA TITAN MARKET")
          .setDescription(
            "🔐 **Kliknij przycisk poniżej.**\n\n" +
            "Po pomyślnej weryfikacji otrzymasz:\n" +
            `✅ **${VERIFIED_ROLE}**\n\n` +
            "💜 Następnie uzyskasz dostęp do serwera."
          ),
      ],
      components: [
        new ActionRowBuilder().addComponents(button),
      ],
    });
  }

  // ===================================================
  // TICKET
  // ===================================================

  if (cmd === "!ticket") {
    return sendTicketMenu(message.channel);
  }

  // ===================================================
  // ZAPROSZENIA
  // ===================================================

  if (
    cmd === "!zaproszenia" ||
    cmd === "!sprawdz"
  ) {
    const key =
      `${message.guild.id}-${message.author.id}`;

    const count =
      inviteCounts.get(key) || 0;

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("📨 TWOJE ZAPROSZENIA")
          .setDescription(
            `${message.author}\n\n` +
            `👥 **Zaproszenia: ${count}**\n\n` +
            "🔥 Zapraszaj znajomych i zdobywaj nagrody!"
          ),
      ],
    });
  }

  // ===================================================
  // DROP
  // ===================================================

  if (cmd === "!drop") {
    const now = Date.now();

    if (now - dropLastUsed < DROP_COOLDOWN) {
      const remaining =
        DROP_COOLDOWN - (now - dropLastUsed);

      return message.reply(
        `⏳ **DROP jest obecnie na cooldownie.**\n` +
        `Spróbuj ponownie za **${formatCooldown(remaining)}**.`
      );
    }

    const button = new ButtonBuilder()
      .setCustomId("drop_button")
      .setLabel("OTWÓRZ DROP")
      .setEmoji("🎁")
      .setStyle(ButtonStyle.Primary);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("🎁 TITAN MARKET — DROP")
          .setDescription(
            "╔════════════════════╗\n" +
            "       🎁 **DROP**\n" +
            "╚════════════════════╝\n\n" +
            "🍀 Masz szansę wygrać nagrodę!\n\n" +
            "⏰ **Cooldown: 2 godziny**\n\n" +
            "👇 Kliknij przycisk poniżej."
          )
          .setFooter({
            text: "Titan Market • Drop System",
          }),
      ],
      components: [
        new ActionRowBuilder().addComponents(button),
      ],
    });
  }

  // ===================================================
  // KONKURS
  // ===================================================

  if (cmd === "!konkursy") {
    if (!isAdmin(message.member)) {
      return message.reply("❌ Tylko administracja.");
    }

    giveawayUsers.clear();

    const button = new ButtonBuilder()
      .setCustomId("giveaway_join")
      .setLabel("WEŹ UDZIAŁ")
      .setEmoji("🎉")
      .setStyle(ButtonStyle.Success);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("🎉 TITAN MARKET — KONKURS")
          .setDescription(
            "🔥 **KONKURS WYSTARTOWAŁ!**\n\n" +
            "Kliknij przycisk, aby dołączyć.\n\n" +
            "🎉 Powodzenia!"
          ),
      ],
      components: [
        new ActionRowBuilder().addComponents(button),
      ],
    });
  }

  // ===================================================
  // LEGIT PANEL
  // ===================================================

  if (cmd === "!legit") {
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("⭐ CZY JESTEŚMY LEGIT?")
          .setDescription(
            "💜 **Titan Market** posiada potwierdzenia prawdziwych transakcji.\n\n" +
            "📌 Wszystkie potwierdzone opinie znajdziesz na kanale **#vouch**.\n\n" +
            "⭐ Vouch jest dodawany dopiero po potwierdzeniu przez klienta."
          )
          .setFooter({
            text: "Titan Market • Legit System",
          }),
      ],
    });
  }

  // ===================================================
  // !LEGIT @USER ILOŚĆ
  // ===================================================

  if (cmd.startsWith("!legit ")) {
    if (!isAdmin(message.member)) {
      return message.reply("❌ Tylko administracja.");
    }

    const user =
      message.mentions.users.first();

    if (!user) {
      return message.reply(
        "❌ Użycie: `!legit @klient ilość`\nPrzykład: `!legit @Kuba 25`"
      );
    }

    const args = cmd.split(/\s+/);

    const amount =
      parseInt(args[2]);

    if (!amount || amount <= 0) {
      return message.reply(
        "❌ Podaj poprawną ilość Titanów.\nPrzykład: `!legit @Kuba 25`"
      );
    }

    const total =
      amount * PRICE_PER_TITAN;

    const key =
      `${message.guild.id}-${user.id}-${Date.now()}`;

    pendingLegit.set(key, {
      userId: user.id,
      amount,
      total,
    });

    const button = new ButtonBuilder()
      .setCustomId(`confirm_legit:${key}`)
      .setLabel("ZAZNACZ LEGIT")
      .setEmoji("⭐")
      .setStyle(ButtonStyle.Success);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("⭐ POTWIERDZENIE TRANSAKCJI")
          .setDescription(
            `👤 **Klient:** <@${user.id}>\n\n` +
            `${TITAN} **Ilość:** ${amount} Titanów\n` +
            `💰 **Kwota:** ${money(total)}\n\n` +
            "Jeżeli transakcja przebiegła prawidłowo, " +
            "klient powinien kliknąć poniższy przycisk.\n\n" +
            "⚠️ Przycisk działa tylko dla wskazanego klienta."
          )
          .setFooter({
            text: "Titan Market • Vouch System",
          }),
      ],
      components: [
        new ActionRowBuilder().addComponents(button),
      ],
    });
  }

  // ===================================================
  // DAILY
  // ===================================================

  if (cmd === "!daily") {
    const date = today();

    const purchases =
      dailyPurchases.get(date) || 0;

    const titans =
      dailyTitans.get(date) || 0;

    const moneyValue =
      dailyMoney.get(date) || 0;

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("💰 TITAN MARKET — DAILY")
          .setDescription(
            `📅 **${date}**\n\n` +
            `🧾 Transakcje: **${purchases}**\n` +
            `${TITAN} Sprzedane Titany: **${titans}**\n` +
            `💵 Obrót: **${money(moneyValue)}**`
          ),
      ],
    });
  }

  // ===================================================
  // REGULAMIN
  // ===================================================

  if (cmd === "!regulamin") {
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("📜 REGULAMIN TITAN MARKET")
          .setDescription(
            "**§1 • ZASADY OGÓLNE**\n" +
            "• Należy przestrzegać regulaminu Discorda oraz serwera.\n" +
            "• Szanuj innych użytkowników i administrację.\n" +
            "• Zakaz podszywania się pod administrację.\n\n" +

            "**§2 • KULTURA**\n" +
            "• Zakaz wyzywania, nękania i prowokowania.\n" +
            "• Zakaz treści rasistowskich, pełnych nienawiści lub NSFW poza przeznaczonymi miejscami.\n\n" +

            "**§3 • SPAM / REKLAMY**\n" +
            "• Zakaz spamu i floodu.\n" +
            "• Zakaz reklam bez zgody administracji.\n" +
            "• Zakaz masowego oznaczania.\n\n" +

            "**§4 • BEZPIECZEŃSTWO**\n" +
            "• Nigdy nie podawaj haseł ani kodów logowania.\n" +
            "• Nie klikaj podejrzanych linków.\n" +
            "• Zakaz prób kradzieży danych.\n\n" +

            "**§5 • TICKETY**\n" +
            "• Jeden użytkownik może posiadać jeden aktywny ticket.\n" +
            "• Ticket służy do konkretnej sprawy.\n" +
            "• Zakaz fałszywych dowodów płatności.\n" +
            "• Ticket może zamknąć wyłącznie administracja.\n\n" +

            "**§6 • ZAKUPY**\n" +
            "• Cena podstawowa: **1 Titan = 1 zł**.\n" +
            "• Przed płatnością sprawdź szczegóły transakcji.\n" +
            "• Nie wysyłaj danych płatniczych na publicznych kanałach.\n\n" +

            "**§7 • VOUCH / LEGIT**\n" +
            "• Vouch może pochodzić wyłącznie z prawdziwej transakcji.\n" +
            "• Zakaz fałszywych opinii.\n" +
            "• Zakaz wymuszania pozytywnych opinii.\n\n" +

            "**§8 • ZAPROSZENIA**\n" +
            "• Zakaz nabijania zaproszeń dodatkowymi kontami.\n" +
            "• Fałszywe zaproszenia mogą zostać usunięte.\n\n" +

            "**§9 • KONKURSY I DROPY**\n" +
            "• Zakaz używania dodatkowych kont do zdobywania nagród.\n" +
            "• Oszustwa mogą skutkować dyskwalifikacją.\n\n" +

            "**§10 • KARY**\n" +
            "• Ostrzeżenie\n" +
            "• Timeout\n" +
            "• Kick\n" +
            "• Ban\n\n" +

            "💜 **Titan Market — szanuj innych i korzystaj z serwera odpowiedzialnie.**"
          ),
      ],
    });
  }
});

// =====================================================
// MENU TICKET
// =====================================================

async function sendTicketMenu(channel) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket_menu")
    .setPlaceholder("🎫 Wybierz kategorię")
    .addOptions([
      {
        label: "Zakup Titan Holo",
        value: "zakup",
        emoji: {
          id: "1536522515092873319",
          name: "TitanHolo",
        },
      },
      {
        label: "Nagroda",
        value: "nagroda",
        emoji: "🎁",
      },
      {
        label: "Pomoc",
        value: "pomoc",
        emoji: "🛠️",
      },
      {
        label: "Współpraca",
        value: "wspolpraca",
        emoji: "🤝",
      },
    ]);

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(PURPL
