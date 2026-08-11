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
  MessageFlags
} = require("discord.js");

// =====================================================
// 🌐 RENDER
// =====================================================

const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Titan Market Bot działa!");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 PORT ${PORT} DZIAŁA`);
});

// =====================================================
// 🤖 DISCORD
// =====================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =====================================================
// 💜 USTAWIENIA
// =====================================================

const PURPLE = 0x8B5CF6;

const VERIFIED_ROLE_NAME = "✅ użytkownik";

const TITAN_EMOJI =
  "<:TitanHolo:1536522515092873319>";

const BLIK_EMOJI =
  "<:Blik:1536522618348380331>";

const PSC_EMOJI =
  "<:Psc:1536522696542781450>";

const MYPSC_EMOJI =
  "<:Mypsc:1536522757595078727>";

// =====================================================
// 💾 DANE
// =====================================================

const inviteCounts = new Map();
const inviteCache = new Map();

const dailyPurchases = new Map();

const pendingLegit = new Map();

const giveawayUsers = new Set();

let giveawayRunning = false;

// =====================================================
// 🧰 FUNKCJE
// =====================================================

function isAdmin(member) {
  return member.permissions.has(
    PermissionsBitField.Flags.Administrator
  );
}

function getChannel(guild, name) {
  return guild.channels.cache.find(
    channel =>
      channel.name === name &&
      channel.type === ChannelType.GuildText
  );
}

// =====================================================
// 🤖 READY
// =====================================================

client.once("ready", async () => {
  console.log(
    `🤖 TITAN MARKET BOT AKTYWNY: ${client.user.tag}`
  );

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
              inviter: invite.inviter?.id
            }
          ])
        )
      );
    } catch (error) {
      console.log(
        `⚠️ Nie można pobrać zaproszeń z ${guild.name}`
      );
    }
  }
});

// =====================================================
// 👋 NOWA OSOBA
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
            inviter: invite.inviter?.id
          }
        ])
      )
    );

    let inviteText =
      "❓ Nie udało się ustalić zaproszenia.";

    if (usedInvite?.inviter) {
      const inviterId = usedInvite.inviter;

      const key =
        `${guild.id}-${inviterId}`;

      const count =
        (inviteCounts.get(key) || 0) + 1;

      inviteCounts.set(key, count);

      inviteText =
        `👤 Zaprosił: <@${inviterId}>\n` +
        `📨 Zaproszenia: **${count}**`;
    }

    const lobby = getChannel(guild, "lobby");

    if (!lobby) return;

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("👋 NOWA OSOBA NA SERWERZE")
        .setDescription(
          `🎉 Witaj ${member}!\n\n` +
          `👤 **${member.user.tag}** dołączył na **Titan Market**.\n\n` +
          inviteText
        )
        .setTimestamp();

    await lobby.send({
      embeds: [embed]
    });

  } catch (error) {
    console.log("❌ Błąd lobby:", error);
  }
});

// =====================================================
// 💬 KOMENDY
// =====================================================

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.guild) return;

  // ===================================================
  // 🏓 PING
  // ===================================================

  if (message.content === "!ping") {
    return message.reply(
      "🏓 **PONG! Titan Market Bot działa!**"
    );
  }

  // ===================================================
  // 👋 LOBBY
  // ===================================================

  if (message.content === "!lobby") {

    if (!isAdmin(message.member)) {
      return message.reply(
        "❌ Tylko administracja może wysłać panel lobby."
      );
    }

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("👋 WITAMY NA TITAN MARKET")
        .setDescription(
          "💜 **Witaj na Titan Market!**\n\n" +
          "🛒 Sklep z Titanami\n" +
          "🎫 Tickety i pomoc\n" +
          "🎁 Konkursy i dropy\n" +
          "⭐ Opinie klientów\n\n" +
          "🛡️ Pamiętaj o weryfikacji przed korzystaniem z serwera."
        )
        .setFooter({
          text: "Titan Market"
        });

    return message.channel.send({
      embeds: [embed]
    });
  }

  // ===================================================
  // 🛒 CENNIK
  // ===================================================

  if (message.content === "!cennik") {

    const ticketButton =
      new ButtonBuilder()
        .setCustomId("open_ticket_from_price")
        .setLabel("Otwórz ticket")
        .setEmoji("🎫")
        .setStyle(ButtonStyle.Primary);

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("🛒 CENNIK — CASE PARADISE")
        .setDescription(
          `${TITAN_EMOJI} **1 TITAN = 1 ZŁ**\n\n` +
          "💰 Możesz kupić dowolną liczbę Titanów.\n\n" +
          "🎫 Kliknij przycisk poniżej, aby rozpocząć zakup."
        );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(ticketButton)
      ]
    });
  }

  // ===================================================
  // 💳 PŁATNOŚCI
  // ===================================================

  if (message.content === "!platnosci") {

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("💳 METODY PŁATNOŚCI")
        .setDescription(
          `${BLIK_EMOJI} **BLIK — 0% PROWIZJI**\n\n` +
          `${PSC_EMOJI} **PSC — 15% PROWIZJI**\n\n` +
          `${MYPSC_EMOJI} **MYPSC — 25% PROWIZJI**`
        );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // ===================================================
  // 🛡️ WERYFIKACJA
  // ===================================================

  if (message.content === "!weryfikacja") {

    const button =
      new ButtonBuilder()
        .setCustomId("verify_user")
        .setLabel("Zweryfikuj się")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success);

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("🛡️ WERYFIKACJA TITAN MARKET")
        .setDescription(
          "## 🔐 WERYFIKACJA\n\n" +
          "Kliknij przycisk **Zweryfikuj się**.\n\n" +
          "Po poprawnej weryfikacji otrzymasz rolę:\n" +
          `**${VERIFIED_ROLE_NAME}**\n\n` +
          "💜 Po weryfikacji uzyskasz dostęp do serwera."
        );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // ===================================================
  // 🎫 TICKET
  // ===================================================

  if (message.content === "!ticket") {

    const menu =
      new StringSelectMenuBuilder()
        .setCustomId("ticket_category")
        .setPlaceholder("🎫 Wybierz kategorię")
        .addOptions([
          {
            label: "Zakup Titan Holo",
            value: "zakup",
            emoji: {
              id: "1536522515092873319",
              name: "TitanHolo"
            }
          },
          {
            label: "Nagroda",
            value: "nagroda",
            emoji: "🎁"
          },
          {
            label: "Pomoc",
            value: "pomoc",
            emoji: "🛠️"
          },
          {
            label: "Współpraca",
            value: "wspolpraca",
            emoji: "🤝"
          }
        ]);

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("🎫 TITAN MARKET — TICKET")
        .setDescription(
          "## 💳 METODY PŁATNOŚCI\n\n" +
          `${BLIK_EMOJI} **BLIK — 0%**\n` +
          `${PSC_EMOJI} **PSC — 15%**\n` +
          `${MYPSC_EMOJI} **MYPSC — 25%**\n\n` +
          "━━━━━━━━━━━━━━━━━━━━\n\n" +
          "## 🎫 WYBIERZ KATEGORIĘ\n\n" +
          "Wybierz odpowiednią kategorię z menu."
        );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });
  }

  // ===================================================
  // 📨 ZAPROSZENIA
  // ===================================================

  if (
    message.content === "!zaproszenia" ||
    message.content === "!sprawdz"
  ) {

    const key =
      `${message.guild.id}-${message.author.id}`;

    const count =
      inviteCounts.get(key) || 0;

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("📨 TWOJE ZAPROSZENIA")
        .setDescription(
          `${message.author}\n\n` +
          `👥 Zaproszenia: **${count}**`
        );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // ===================================================
  // 📜 REGULAMIN
  // ===================================================

  if (message.content === "!regulamin") {

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("📜 REGULAMIN TITAN MARKET")
        .setDescription(
          "**§1. ZASADY OGÓLNE**\n\n" +
          "1.1. Dołączając do serwera akceptujesz regulamin.\n" +
          "1.2. Należy przestrzegać zasad Discorda oraz zasad Titan Market.\n" +
          "1.3. Administracja może reagować na łamanie zasad.\n" +
          "1.4. Nieznajomość regulaminu nie zwalnia z jego przestrzegania.\n\n" +

          "**§2. SZACUNEK I KULTURA**\n\n" +
          "2.1. Zakaz obrażania, wyzywania i nękania użytkowników.\n" +
          "2.2. Zakaz prowokowania i celowego rozpoczynania konfliktów.\n" +
          "2.3. Zakaz treści dyskryminujących lub pełnych nienawiści.\n" +
          "2.4. Zakaz publikowania treści NSFW w miejscach do tego nieprzeznaczonych.\n\n" +

          "**§3. SPAM I REKLAMY**\n\n" +
          "3.1. Zakaz spamu i floodu.\n" +
          "3.2. Zakaz masowego oznaczania użytkowników.\n" +
          "3.3. Zakaz reklamowania innych serwerów bez zgody administracji.\n" +
          "3.4. Zakaz wysyłania reklam na prywatne wiadomości użytkowników.\n\n" +

          "**§4. BEZPIECZEŃSTWO**\n\n" +
          "4.1. Nie podawaj nikomu haseł ani kodów logowania.\n" +
          "4.2. Administracja nie powinna prosić Cię o hasło.\n" +
          "4.3. Nie klikaj podejrzanych linków.\n" +
          "4.4. Nie podszywaj się pod administrację.\n" +
          "4.5. Zakaz prób kradzieży kont lub danych innych osób.\n\n" +

          "**§5. TICKETY**\n\n" +
          "5.1. Ticket służy do konkretnej sprawy.\n" +
          "5.2. Nie twórz wielu ticketów bez powodu.\n" +
          "5.3. Nie spamuj administracji.\n" +
          "5.4. Fałszywe potwierdzenia płatności są zabronione.\n" +
          "5.5. Ticket może zostać zamknięty przez administrację.\n" +
          "5.6. Użytkownik nie może samodzielnie zamknąć ticketu.\n\n" +

          "**§6. PŁATNOŚCI I ZAKUPY**\n\n" +
          "6.1. Aktualny cennik znajduje się na odpowiednim kanale.\n" +
          "6.2. Przed płatnością upewnij się, że rozmawiasz z właściwą osobą.\n" +
          "6.3. Nie wysyłaj danych płatniczych na publicznych kanałach.\n" +
          "6.4. Zakaz fałszowania dowodów płatności.\n\n" +

          "**§7. VOUCH / LEGIT**\n\n" +
          "7.1. Vouch może wystawić tylko osoba, która rzeczywiście dokonała transakcji.\n" +
          "7.2. Zakaz fałszywych opinii.\n" +
          "7.3. Zakaz wymuszania pozytywnych opinii.\n" +
          "7.4. Zakaz podszywania się pod innych klientów.\n\n" +

          "**§8. ZAPROSZENIA**\n\n" +
          "8.1. Zakaz fałszywych zaproszeń.\n" +
          "8.2. Zakaz nabijania zaproszeń poprzez dodatkowe konta.\n" +
          "8.3. Zaproszenia zdobyte nieuczciwie mogą zostać usunięte.\n\n" +

          "**§9. KONKURSY I DROPY**\n\n" +
          "9.1. Każdy konkurs może mieć własne zasady.\n" +
          "9.2. Zakaz używania dodatkowych kont do zdobywania nagród.\n" +
          "9.3. Próby oszustwa mogą skutkować dyskwalifikacją.\n\n" +

          "**§10. KARY**\n\n" +
          "10.1. Ostrzeżenie.\n" +
          "10.2. Timeout / mute.\n" +
          "10.3. Kick.\n" +
          "10.4. Ban.\n" +
          "10.5. Kara zależy od sytuacji i jej powagi.\n\n" +

          "💜 **Titan Market — szanuj innych, przestrzegaj zasad i korzystaj z serwera odpowiedzialnie.**"
        );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // ===================================================
  // 🎁 DROP
  // ===================================================

  if (message.content === "!drop") {

    const button =
      new ButtonBuilder()
        .setCustomId("drop_button")
        .setLabel("Wylosuj")
        .setEmoji("🎁")
        .setStyle(ButtonStyle.Primary);

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("🎁 DROP TITAN MARKET")
        .setDescription(
          "🍀 Spróbuj swojego szczęścia!\n\n" +
          "🎁 Kliknij **Wylosuj**.\n\n" +
          "⚠️ Szansa na nagrodę jest ograniczona."
        );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // ===================================================
  // 🎉 KONKURS
  // ===================================================

  if (message.content === "!konkursy") {

    if (!isAdmin(message.member)) {
      return message.reply(
        "❌ Tylko administracja może uruchomić konkurs."
      );
    }

    giveawayUsers.clear();
    giveawayRunning = true;

    const button =
      new ButtonBuilder()
        .setCustomId("giveaway_join")
        .setLabel("Weź udział")
        .setEmoji("🎉")
        .setStyle(ButtonStyle.Success);

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("🎉 KONKURS TITAN MARKET")
        .setDescription(
          "🔥 **Konkurs właśnie wystartował!**\n\n" +
          "Kliknij **🎉 Weź udział**.\n\n" +
          "👥 Uczestnicy: **0**"
        );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // ===================================================
  // ⭐ CZY JESTEŚMY LEGIT
  // ===================================================

  if (message.content === "!legit") {

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("⭐ CZY JESTEŚMY LEGIT?")
        .setDescription(
          "Chcesz zobaczyć potwierdzenia transakcji?\n\n" +
          "📋 Prawdziwe potwierdzenia klientów są publikowane w kanale **vouch**.\n\n" +
          "⭐ Każde potwierdzenie może zostać dodane dopiero po akceptacji klienta."
        );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // ===================================================
  // ⭐ !potwierdz @klient
  // ===================================================

  if (message.content.startsWith("!potwierdz")) {

    if (!isAdmin(message.member)) {
      return message.reply(
        "❌ Tylko administracja może wysłać prośbę o potwierdzenie."
      );
    }

    const target =
      message.mentions.users.first();

    if (!target) {
      return message.reply(
        "❌ Użycie: `!potwierdz @klient`"
      );
    }

    const key =
      `${message.guild.id}-${target.id}`;

    pendingLegit.set(key, {
      userId: target.id,
      adminId: message.author.id
    });

    const button =
      new ButtonBuilder()
        .setCustomId(`confirm_legit_${target.id}`)
        .setLabel("Potwierdzam transakcję")
        .setEmoji("⭐")
        .setStyle(ButtonStyle.Success);

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("⭐ POTWIERDZENIE TRANSAKCJI")
        .setDescription(
          `👤 Klient: <@${target.id}>\n\n` +
          "Jeżeli transakcja rzeczywiście została wykonana i wszystko jest w porządku, " +
          "klient może kliknąć przycisk poniżej.\n\n" +
          "Po kliknięciu potwierdzenie zostanie dodane do kanału **vouch**."
        );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // ===================================================
  // 💰 DAILY
  // ===================================================

  if (message.content === "!daily") {

    const today =
      new Date().toLocaleDateString("pl-PL");

    const count =
      dailyPurchases.get(today) || 0;

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("💰 DAILY — TITAN MARKET")
        .setDescription(
          `📅 **${today}**\n\n` +
          `🛒 Dzisiaj potwierdzonych zakupów: **${count}**`
        );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // ===================================================
  // 🛒 POTWIERDZENIE ZAKUPU
  // ===================================================

  if (message.content === "!zakup") {

    if (!isAdmin(message.member)) {
      return message.reply(
        "❌ Tylko administracja może potwierdzić zakup."
      );
    }

    const today =
      new Date().toLocaleDateString("pl-PL");

    const count =
      dailyPurchases.get(today) || 0;

    dailyPurchases.set(
      today,
      count + 1
    );

    return message.reply(
      `✅ Zakup dodany do DAILY!\n` +
      `🛒 Dzisiaj: **${count + 1}**`
    );
  }
});

// =====================================================
// 🖱️ INTERAKCJE
// =====================================================

client.on("interactionCreate", async interaction => {

  // ===================================================
  // 🛡️ WERYFIKACJA
  // ===================================================

  if (
    interaction.isButton() &&
    interaction.customId === "verify_user"
  ) {

    const role =
      interaction.guild.roles.cache.find(
        r => r.name === VERIFIED_ROLE_NAME
      );

    if (!role) {
      return interaction.reply({
        content:
          `❌ Nie znaleziono roli **${VERIFIED_ROLE_NAME}**.`,
        flags: MessageFlags.Ephemeral
      });
    }

    const botMember =
      interaction.guild.members.me;

    if (
      !botMember ||
      role.position >= botMember.roles.highest.position
    ) {
      return interaction.reply({
        content:
          "❌ Rola bota mu
