const http=require("http");
const{
 Client,GatewayIntentBits,ChannelType,PermissionsBitField,
 ActionRowBuilder,ButtonBuilder,ButtonStyle,
 StringSelectMenuBuilder,EmbedBuilder
}=require("discord.js");

// RENDER
const PORT=process.env.PORT||10000;
http.createServer((req,res)=>res.end("Titan Market ONLINE"))
.listen(PORT,"0.0.0.0",()=>console.log("🌐 Render ONLINE"));

// BOT
const bot=new Client({
 intents:[
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildInvites,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
 ]
});

// USTAWIENIA
const COLOR=0x8B5CF6;
const ROLE="✅ użytkownik";

const TITAN="<:TitanHolo:1536522515092873319>";
const BLIK="<:Blik:1536522618348380331>";
const PSC="<:Psc:1536522696542781450>";
const MYPSC="<:Mypsc:1536522757595078727>";

const inviteData=new Map();
const inviteCount=new Map();
const tickets=new Map();
const legit=new Map();
const dropCD=new Map();
const daily=new Map();
const giveaway=new Set();

const isAdmin=m=>m.permissions.has(PermissionsBitField.Flags.Administrator);

const getCh=(g,n)=>g.channels.cache.find(c=>c.name===n&&c.type===ChannelType.GuildText);

const E=(title,text)=>new EmbedBuilder()
 .setColor(COLOR)
 .setTitle(title)
 .setDescription(text)
 .setFooter({text:"💜 Titan Market"})
 .setTimestamp();

// START
bot.once("ready",async()=>{
 console.log(`🤖 TITAN MARKET AKTYWNY: ${bot.user.tag}`);

 for(const g of bot.guilds.cache.values()){
  try{
   const x=await g.invites.fetch();
   inviteData.set(g.id,new Map(x.map(i=>[i.code,i.uses||0])));
  }catch{}
 }
});

// LOBBY + ZAPROSZENIA
bot.on("guildMemberAdd",async member=>{
 const lobby=getCh(member.guild,"lobby");
 if(!lobby)return;

 let who="Nieznany";
 let count=0;

 try{
  const old=inviteData.get(member.guild.id)||new Map();
  const now=await member.guild.invites.fetch();

  for(const i of now.values()){
   if((i.uses||0)>(old.get(i.code)||0)){
    if(i.inviter){
     who=`<@${i.inviter.id}>`;
     const key=member.guild.id+"-"+i.inviter.id;
     count=(inviteCount.get(key)||0)+1;
     inviteCount.set(key,count);
    }
    break;
   }
  }

  inviteData.set(
   member.guild.id,
   new Map(now.map(i=>[i.code,i.uses||0]))
  );
 }catch{}

 lobby.send({
  embeds:[E(
   "👋 NOWA OSOBA NA TITAN MARKET",
   `🎉 Witaj ${member}!\n\n`+
   `👤 Zaprosił: ${who}\n`+
   `📨 Zaproszenia tej osoby: **${count}**`
  )]
 });
});

// KOMENDY
bot.on("messageCreate",async m=>{
 if(m.author.bot||!m.guild)return;
 const c=m.content.trim();

 if(c==="!ping")
  return m.reply("🏓 **PONG! Titan Market Bot działa!**");

 if(c==="!aktywuj")
  return m.reply("✅ **Titan Market Bot jest aktywny!** 🟢");

 // LOBBY
 if(c==="!lobby"){
  if(!isAdmin(m.member))return m.reply("❌ Tylko administracja.");
  return m.channel.send({
   embeds:[E(
    "👋 WITAJ NA TITAN MARKET",
    "💜 **Profesjonalny sklep z Titanami**\n\n"+
    "🛒 Zakupy\n🎫 Tickety\n⭐ Vouch / Legit\n"+
    "🎁 Dropy\n🎉 Konkursy\n📨 Zaproszenia\n🛡️ Weryfikacja"
   )]
  });
 }

 // WERYFIKACJA
 if(c==="!weryfikacja"){
  const b=new ButtonBuilder()
   .setCustomId("verify")
   .setLabel("Zweryfikuj się")
   .setEmoji("✅")
   .setStyle(ButtonStyle.Success);

  return m.channel.send({
   embeds:[E(
    "🛡️ WERYFIKACJA TITAN MARKET",
    `Kliknij **Zweryfikuj się**, aby otrzymać rolę **${ROLE}**.`
   )],
   components:[new ActionRowBuilder().addComponents(b)]
  });
 }

 // CENNIK
 if(c==="!cennik"){
  const b=new ButtonBuilder()
   .setCustomId("openTicket")
   .setLabel("Otwórz ticket")
   .setEmoji("🎫")
   .setStyle(ButtonStyle.Primary);

  return m.channel.send({
   embeds:[E(
    "🛒 CENNIK — CASE PARADISE",
    `${TITAN} **1 TITAN = 1 ZŁ**\n\n`+
    "💰 Kup dowolną liczbę Titanów.\n\n"+
    "🎫 Kliknij przycisk poniżej, aby rozpocząć zakup."
   )],
   components:[new ActionRowBuilder().addComponents(b)]
  });
 }

 // PŁATNOŚCI
 if(c==="!platnosci")
  return m.channel.send({
   embeds:[E(
    "💳 METODY PŁATNOŚCI",
    `${BLIK} **BLIK — 0%**\n\n`+
    `${PSC} **PSC — 15%**\n\n`+
    `${MYPSC} **MyPSC — 25%**`
   )]
  });

 // TICKET
 if(c==="!ticket")return ticketPanel(m.channel);

 // ZAPROSZENIA
 if(c==="!zaproszenia"||c==="!sprawdz"){
  const n=inviteCount.get(m.guild.id+"-"+m.author.id)||0;
  return m.reply(`📨 **Masz ${n} zaproszeń.**`);
 }

 // LEGIT
 if(c==="!legit")
  return m.channel.send({
   embeds:[E(
    "⭐ CZY JESTEŚMY LEGIT?",
    "Chcesz zobaczyć prawdziwe potwierdzenia?\n\n"+
    "⭐ Opinie klientów są publikowane na kanale **vouch**."
   )]
  });

 // POTWIERDZENIE DLA KLIENTA
 if(c.startsWith("!potwierdz")){
  if(!isAdmin(m.member))return m.reply("❌ Tylko administracja.");

  const user=m.mentions.users.first();
  const amount=Number(c.split(" ")[2]);

  if(!user||!amount||amount<1)
   return m.reply("❌ Użycie: `!potwierdz @klient ilość`");

  const key=m.guild.id+"-"+user.id;
  legit.set(key,amount);

  const b=new ButtonBuilder()
   .setCustomId("legit:"+user.id)
   .setLabel("Potwierdzam — LEGIT")
   .setEmoji("⭐")
   .setStyle(ButtonStyle.Success);

  return m.channel.send({
   embeds:[E(
    "⭐ POTWIERDZENIE TRANSAKCJI",
    `👤 Klient: <@${user.id}>\n\n`+
    `🛒 **${amount} Titanów**\n`+
    `💰 **${amount} zł**\n\n`+
    "Jeżeli wszystko się zgadza, kliknij **LEGIT**."
   )],
   components:[new ActionRowBuilder().addComponents(b)]
  });
 }

 // DAILY
 if(c==="!daily"){
  const d=new Date().toLocaleDateString("pl-PL");
  return m.channel.send({
   embeds:[E(
    "📊 DAILY — TITAN MARKET",
    `📅 **${d}**\n\n🛒 Potwierdzonych zakupów: **${daily.get(d)||0}**`
   )]
  });
 }

 if(c==="!zakup"){
  if(!isAdmin(m.member))return m.reply("❌ Tylko administracja.");
  const d=new Date().toLocaleDateString("pl-PL");
  daily.set(d,(daily.get(d)||0)+1);
  return m.reply(`✅ Dodano zakup do DAILY: **${daily.get(d)}**`);
 }

 // DROP — PANEL Z PRZYCISKIEM
 if(c==="!drop"){
  const b=new ButtonBuilder()
   .setCustomId("drop")
   .setLabel("Wylosuj")
   .setEmoji("🎁")
   .setStyle(ButtonStyle.Primary);

  return m.channel.send({
   embeds:[E(
    "🎁 DROP TITAN MARKET",
    "🍀 **Spróbuj swojego szczęścia!**\n\n"+
    "🎁 Kliknij **Wylosuj**.\n\n"+
    "⏳ Każdy użytkownik może użyć dropa raz na **2 godziny**."
   )],
   components:[new ActionRowBuilder().addComponents(b)]
  });
 }

 // KONKURS
 if(c==="!konkursy"){
  if(!isAdmin(m.member))return m.reply("❌ Tylko administracja.");
  giveaway.clear();

  const b=new ButtonBuilder()
   .setCustomId("giveaway")
   .setLabel("Weź udział")
   .setEmoji("🎉")
   .setStyle(ButtonStyle.Success);

  return m.channel.send({
   embeds:[E(
    "🎉 KONKURS TITAN MARKET",
    "🔥 **Konkurs właśnie wystartował!**\n\n"+
    "Kliknij **🎉 Weź udział**."
   )],
   components:[new ActionRowBuilder().addComponents(b)]
  });
 }

 // REGULAMIN
 if(c==="!regulamin")
  return m.channel.send({
   embeds:[E(
    "📜 REGULAMIN TITAN MARKET",
    "**§1 OGÓLNE**\n"+
    "• Przestrzegaj zasad Discorda i serwera.\n"+
    "• Szanuj innych użytkowników.\n"+
    "• Zakaz podszywania się pod administrację.\n\n"+

    "**§2 KULTURA**\n"+
    "• Zakaz wyzwisk, nękania i prowokacji.\n"+
    "• Zakaz treści nienawistnych.\n"+
    "• Zakaz NSFW poza przeznaczonymi miejscami.\n\n"+

    "**§3 SPAM I REKLAMY**\n"+
    "• Zakaz spamu i floodu.\n"+
    "• Zakaz reklam bez zgody administracji.\n\n"+

    "**§4 BEZPIECZEŃSTWO**\n"+
    "• Nie podawaj haseł ani kodów.\n"+
    "• Nie klikaj podejrzanych linków.\n\n"+

    "**§5 TICKETY**\n"+
    "• Ticket służy do konkretnej sprawy.\n"+
    "• Nie twórz wielu ticketów bez powodu.\n"+
    "• Zakaz fałszywych dowodów płatności.\n"+
    "• Ticket może zamknąć tylko administracja.\n\n"+

    "**§6 VOUCH / LEGIT**\n"+
    "• Vouch tylko za prawdziwą transakcję.\n"+
    "• Zakaz fałszywych opinii.\n"+
    "• Zakaz wymuszania Vouchów.\n\n"+

    "**§7 ZAPROSZENIA**\n"+
    "• Zakaz nabijania zaproszeń multikontami.\n\n"+

    "**§8 KONKURSY I DROPY**\n"+
    "• Zakaz używania multikont.\n"+
    "• Oszustwa mogą skutkować dyskwalifikacją.\n\n"+

    "**§9 KARY**\n"+
    "• Ostrzeżenie • Timeout • Kick • Ban\n\n"+
    "💜 **Titan Market — szanuj innych i przestrzegaj zasad.**"
   )]
  });
});

// PANEL TICKET
async function ticketPanel(ch){
 const menu=new StringSelectMenuBuilder()
  .setCustomId("ticketMenu")
  .setPlaceholder("🎫 Wybierz kategorię")
  .addOptions(
   {label:"Zakup Titan Holo",value:"zakup",emoji:{id:"1536522515092873319",name:"TitanHolo"}},
   {label:"Nagroda",value:"nagroda",emoji:"🎁"},
   {label:"Pomoc",value:"pomoc",emoji:"🛠️"},
   {label:"Współpraca",value:"wspolpraca",emoji:"🤝"}
  );

 await ch.send({
  embeds:[E(
   "🎫 TITAN MARKET — TICKET",
   `${TITAN} **TITAN HOLO**\n\n`+
   `${BLIK} **BLIK — 0%**\n`+
   `${PSC} **PSC — 15%**\n`+
   `${MYPSC} **MYPSC — 25%**\n\n`+
   "━━━━━━━━━━━━━━━━━━\n\n"+
   "🎫 Wybierz kategorię z menu."
  )],
  components:[new ActionRowBuilder().addComponents(menu)]
 });
}

// INTERAKCJE
bot.on("interactionCreate",async i=>{

 // WERYFIKACJA
 if(i.isButton()&&i.customId==="verify"){
  const role=i.guild.roles.cache.find(r=>r.name===ROLE);
  if(!role)return i.reply({content:`❌ Brak roli **${ROLE}**.`,ephemeral:true});

  try{
   await i.member.roles.add(role);
   return i.reply({content:"✅ **Zweryfikowano!**",ephemeral:true});
  }catch{
   return i.reply({
    content:"❌ Bot nie może nadać roli. Przenieś jego rolę wyżej.",
   
