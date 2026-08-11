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

// RENDER
http.createServer((req,res)=>res.end("Titan Market ONLINE"))
.listen(process.env.PORT || 10000,"0.0.0.0");

// BOT
const client = new Client({
  intents:[
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.MessageContent
  ]
});

const PURPLE = 0x8B5CF6;

const TITAN = "<:TitanHolo:1536522515092873319>";
const BLIK = "<:Blik:1536522618348380331>";
const PSC = "<:Psc:1536522696542781450>";
const MYPSC = "<:Mypsc:1536522757595078727>";

const drops = new Map();
const legit = new Map();
const daily = new Map();
const invites = new Map();
const giveaway = new Set();

function admin(m){
  return m.permissions.has(
    PermissionsBitField.Flags.Administrator
  );
}

function channel(guild,name){
  return guild.channels.cache.find(
    c=>c.name===name && c.type===ChannelType.GuildText
  );
}

function box(title,text){
  return new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle(title)
    .setDescription(text)
    .setFooter({text:"💜 Titan Market"});
}

// READY
client.once("ready",()=>{
  console.log("🤖 TITAN MARKET BOT AKTYWNY");
});

// LOBBY
client.on("guildMemberAdd",member=>{
  const lobby=channel(member.guild,"lobby");
  if(!lobby)return;

  lobby.send({
    embeds:[
      box(
        "👋 NOWA OSOBA",
        `🎉 Witaj ${member}!\n\n`+
        `👤 **${member.user.tag}** dołączył na Titan Market.`
      )
    ]
  }).catch(()=>{});
});

// KOMENDY
client.on("messageCreate",async message=>{
  if(message.author.bot || !message.guild)return;

  const x=message.content.trim();

  // AKTYWACJA
  if(x==="!aktywuj")
    return message.reply("🟢 **TITAN MARKET BOT JEST AKTYWNY!**");

  // PING
  if(x==="!ping")
    return message.reply("🏓 **PONG!**");

  // LOBBY
  if(x==="!lobby"){
    return message.channel.send({
      embeds:[
        box(
          "👋 WITAJ NA TITAN MARKET",
          "💜 Witaj na naszym serwerze!\n\n"+
          "🛒 Sklep Titan Market\n"+
          "🎫 Tickety\n"+
          "🎁 Dropy\n"+
          "🎉 Konkursy\n"+
          "⭐ Vouch / Legit\n"+
          "📨 Zaproszenia"
        )
      ]
    });
  }

  // CENNIK
  if(x==="!cennik"){
    return message.channel.send({
      embeds:[
        box(
          "🛒 CENNIK — TITAN MARKET",
          `${TITAN} **1 TITAN = 1 ZŁ**\n\n`+
          "📦 1 Titan — **1 zł**\n"+
          "📦 5 Titanów — **5 zł**\n"+
          "📦 10 Titanów — **10 zł**\n"+
          "📦 25 Titanów — **25 zł**\n"+
          "📦 50 Titanów — **50 zł**\n\n"+
          "💜 Możesz kupić dowolną ilość."
        )
      ]
    });
  }

  // PŁATNOŚCI
  if(x==="!platnosci"){
    return message.channel.send({
      embeds:[
        box(
          "💳 METODY PŁATNOŚCI",
          `${BLIK} **BLIK — 0%**\n\n`+
          `${PSC} **PSC — 15%**\n\n`+
          `${MYPSC} **MyPSC — 25%**`
        )
      ]
    });
  }

  // TICKET
  if(x==="!ticket"){
    const menu=new StringSelectMenuBuilder()
      .setCustomId("ticket")
      .setPlaceholder("🎫 Wybierz kategorię")
      .addOptions([
        {
          label:"Zakup Titan Holo",
          value:"zakup",
          emoji:{
            id:"1536522515092873319",
            name:"TitanHolo"
          }
        },
        {
          label:"Nagroda",
          value:"nagroda",
          emoji:"🎁"
        },
        {
          label:"Pomoc",
          value:"pomoc",
          emoji:"🛠️"
        },
        {
          label:"Współpraca",
          value:"wspolpraca",
          emoji:"🤝"
        }
      ]);

    return message.channel.send({
      embeds:[
        box(
          "🎫 TITAN MARKET — TICKET",
          `${TITAN} **Zakup Titanów**\n\n`+
          "🎁 Nagroda\n"+
          "🛠️ Pomoc\n"+
          "🤝 Współpraca\n\n"+
          "👇 Wybierz kategorię."
        )
      ],
      components:[
        new ActionRowBuilder().addComponents(menu)
      ]
    });
  }

  // DROP
  if(x==="!drop"){
    const button=new ButtonBuilder()
      .setCustomId("drop")
      .setLabel("WYLĄDUJ")
      .setEmoji("🎁")
      .setStyle(ButtonStyle.Primary);

    return message.channel.send({
      embeds:[
        box(
          "🎁 TITAN DROP",
          "🍀 Kliknij przycisk i spróbuj szczęścia!\n\n"+
          "⏳ **Cooldown: 2 godziny**\n"+
          "🎉 Szansa na wygraną: **5%**"
        )
      ],
      components:[
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // LEGIT
  if(x==="!legit"){
    return message.channel.send({
      embeds:[
        box(
          "⭐ CZY JESTEŚMY LEGIT?",
          "💜 Chcesz zobaczyć opinie klientów?\n\n"+
          "⭐ Wszystkie potwierdzone transakcje znajdują się na kanale **vouch**.\n\n"+
          "✅ Opinie są dodawane po potwierdzeniu przez klienta."
        )
      ]
    });
  }

  // POTWIERDZENIE
  if(x.startsWith("!potwierdz")){
    if(!admin(message.member))
      return message.reply("❌ Tylko administracja.");

    const user=message.mentions.users.first();
    const amount=Number(x.split(" ")[2]);

    if(!user || !amount)
      return message.reply(
        "❌ Użycie: `!potwierdz @klient ilość`"
      );

    legit.set(user.id,amount);

    const button=new ButtonBuilder()
      .setCustomId("legit_"+user.id)
      .setLabel("POTWIERDZAM — LEGIT")
      .setEmoji("⭐")
      .setStyle(ButtonStyle.Success);

    return message.channel.send({
      embeds:[
        box(
          "⭐ POTWIERDZENIE TRANSAKCJI",
          `👤 Klient: ${user}\n\n`+
          `🛒 Titanów: **${amount}**\n`+
          `💰 Kwota: **${amount} zł**\n\n`+
          "Jeżeli wszystko się zgadza, kliknij **LEGIT**."
        )
      ],
      components:[
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // DAILY
  if(x==="!daily"){
    const d=new Date().toLocaleDateString("pl-PL");

    return message.channel.send({
      embeds:[
        box(
          "💰 DAILY",
          `📅 **${d}**\n\n`+
          `🛒 Zakupy dzisiaj: **${daily.get(d)||0}**`
        )
      ]
    });
  }

  // DODAJ ZAKUP
  if(x==="!zakup"){
    if(!admin(message.member))
      return message.reply("❌ Tylko administracja.");

    const d=new Date().toLocaleDateString("pl-PL");
    const n=(daily.get(d)||0)+1;

    daily.set(d,n);

    return message.reply(
      `✅ Zakup dodany!\n🛒 Dzisiaj: **${n}**`
    );
  }

  // ZAPROSZENIA
  if(x==="!zaproszenia"){
    const n=invites.get(message.author.id)||0;

    return message.channel.send({
      embeds:[
        box(
          "📨 TWOJE ZAPROSZENIA",
          `👤 ${message.author}\n\n`+
          `📨 Zaproszenia: **${n}**`
        )
      ]
    });
  }

  // KONKURS
  if(x==="!konkursy"){
    if(!admin(message.member))
      return message.reply("❌ Tylko administracja.");

    giveaway.clear();

    const button=new ButtonBuilder()
      .setCustomId("giveaway")
      .setLabel("WEŹ UDZIAŁ")
      .setEmoji("🎉")
      .setStyle(ButtonStyle.Success);

    return message.channel.send({
      embeds:[
        box(
          "🎉 KONKURS TITAN MARKET",
          "🔥 **Konkurs wystartował!**\n\n"+
          "Kliknij przycisk, aby dołączyć."
        )
      ],
      components:[
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // REGULAMIN
  if(x==="!regulamin"){
    return message.channel.send({
      embeds:[
        box(
          "📜 REGULAMIN TITAN MARKET",
          "**§1 OGÓLNE**\n"+
          "• Szanuj innych użytkowników.\n"+
          "• Przestrzegaj zasad Discorda.\n"+
          "• Zakaz podszywania się pod administrację.\n\n"+

          "**§2 ZACHOWANIE**\n"+
          "• Zakaz wyzwisk i nękania.\n"+
          "• Zakaz prowokowania.\n"+
          "• Zakaz spamu i floodu.\n"+
          "• Zakaz reklam bez zgody administracji.\n\n"+

          "**§3 BEZPIECZEŃSTWO**\n"+
          "• Nie podawaj haseł ani kodów.\n"+
          "• Nie klikaj podejrzanych linków.\n"+
          "• Nie próbuj kraść danych innych osób.\n\n"+

          "**§4 TICKETY**\n"+
          "• Nie twórz wielu ticketów bez powodu.\n"+
          "• Nie spamuj administracji.\n"+
          "• Fałszywe dowody płatności są zabronione.\n"+
          "• Ticket zamyka tylko administracja.\n\n"+

          "**§5 VOUCH / LEGIT**\n"+
          "• Vouch tylko za prawdziwą transakcję.\n"+
          "• Zakaz fałszywych opinii.\n"+
          "• Zakaz wymuszania Vouchów.\n\n"+

          "**§6 KONKURSY I DROPY**\n"+
          "• Zakaz multikont do zdobywania nagród.\n"+
          "• Oszustwa mogą oznaczać dyskwalifikację.\n\n"+

          "**§7 KARY**\n"+
          "• Ostrzeżenie\n"+
          "• Timeout\n"+
          "• Kick\n"+
          "• Ban"
        )
      ]
    });
  }
});

// INTERAKCJE
client.on("interactionCreate",async i=>{

  // DROP
  if(i.isButton() && i.customId==="drop"){
    const last=drops.get(i.user.id)||0;
    const remaining=7200000-(Date.now()-last);

    if(remaining>0)
      return i.reply({
        content:"⏳ **Twój drop jest jeszcze na cooldownie 2h.**",
        ephemeral:true
      });

    drops.set(i.user.id,Date.now());

    if(Math.random()<0.05)
      return i.reply({
        content:"🎉 **GRATULACJE! Wygrałeś nagrodę!**",
        ephemeral:true
      });

    return i.reply({
      content:"😢 Tym razem się nie udało! Spróbuj ponownie za 2h.",
      ephemeral:true
    });
  }

  // LEGIT
  if(i.isButton() && i.customId.startsWith("legit_")){
    const id=i.customId.replace("legit_","");

    if(i.user.id!==id)
      return i.reply({
        content:"❌ Ten przycisk nie jest dla Ciebie.",
        ephemeral:true
      });

    const amount=legit.get(id);
    const vouch=channel(i.guild,"vouch");

    if(!amount)
      return i.reply({
        content:"❌ Potwierdzenie wygasło.",
        ephemeral:true
      });

    if(!vouch)
      return i.reply({
        content:"❌ Nie znaleziono kanału `vouch`.",
        ephemeral:true
      });

    await vouch.send({
      embeds:[
        box(
          "⭐ NOWY VOUCH",
          `+rep **${i.user.username}**\n\n`+
          `🛒 **${amount} Titanów**\n`+
          `💰 **${amount} zł**\n\n`+
          "✅ Transakcja potwierdzona."
        )
      ]
    });

    legit.delete(id);

    return i.reply({
      content:"⭐ **Vouch został dodany!**",
      ephemeral:true
    });
  }

  // KONKURS
  if(i.isButton() && i.customId==="giveaway"){
    if(giveaway.has(i.user.id))
      return i.reply({
        content:"⚠️ Już bierzesz udział!",
        ephemeral:true
      });

    giveaway.add(i.user.id);

    return i.reply({
      content:"🎉 **Dołączono do konkursu!**",
      ephemeral:true
    });
  }

  // TICKET
  if(i.isStringSelectMenu() && i.customId==="ticket"){
    const type=i.values[0];

    const c=await i.guild.channels.create({
      name:"🎫・"+type+"-"+i.user.username,
      type:ChannelType.GuildText,
      permissionOverwrites:[
        {
          id:i.guild.id,
          deny:[PermissionsBitField.Flags.ViewChannel]
        },
        {
          id:i.user.id,
          allow:[
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ]
    });

    await c.send({
      content:`${i.user}`,
      embeds:[
        box(
          "🎫 TITAN MARKET",
          `${TITAN} **1 TITAN = 1 ZŁ**\n\n`+
          `${BLIK} BLIK — 0%\n`+
          `${PSC} PSC — 15%\n`+
          `${MYPSC} MyPSC — 25%\n\n`+
          "💬 Napisz, w czym możemy Ci pomóc.\n\n"+
          "🔒 **Ticket może zamknąć tylko administracja.**"
        )
      ]
    });

    return i.reply({
      content:`✅ Ticket utworzony: ${c}`,
      ephemeral:true
    });
  }
});

// TOKEN
if(!process.env.TOKEN){
  console.error("❌ BRAK TOKEN W RENDER!");
  process.exit(1);
}

client.login(process.env.TOKEN)
.then(()=>console.log("🔑 DISCORD ZALOGOWANY"))
.catch(e=>{
  console.error("❌ TOKEN ERROR:",e.message);
  process.exit(1);
});
