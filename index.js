const http=require("http");
const{Client,GatewayIntentBits,ChannelType,PermissionsBitField,ActionRowBuilder,ButtonBuilder,ButtonStyle,StringSelectMenuBuilder,EmbedBuilder}=require("discord.js");

http.createServer((q,s)=>s.end("ONLINE")).listen(process.env.PORT||10000,"0.0.0.0");

const bot=new Client({intents:[
 GatewayIntentBits.Guilds,
 GatewayIntentBits.GuildMembers,
 GatewayIntentBits.GuildMessages,
 GatewayIntentBits.MessageContent
]});

const C=0x8B5CF6;
const TITAN="<:TitanHolo:1536522515092873319>";
const BLIK="<:Blik:1536522618348380331>";
const PSC="<:Psc:1536522696542781450>";
const MYPSC="<:Mypsc:1536522757595078727>";

const cd=new Map(),legit=new Map(),daily=new Map();

const embed=(t,d)=>new EmbedBuilder()
 .setColor(C).setTitle(t).setDescription(d)
 .setFooter({text:"💜 Titan Market"});

const admin=m=>m.permissions.has(PermissionsBitField.Flags.Administrator);
const ch=(g,n)=>g.channels.cache.find(x=>x.name===n);

bot.once("ready",()=>console.log("🤖 BOT AKTYWNY"));

bot.on("guildMemberAdd",m=>{
 const l=ch(m.guild,"lobby");
 if(l)l.send({embeds:[embed("👋 WITAJ NA TITAN MARKET",
 `🎉 Witaj ${m}!\n\n💜 Miłego korzystania z serwera!`)]});
});

bot.on("messageCreate",async m=>{
 if(m.author.bot||!m.guild)return;
 const x=m.content.trim();

 if(x==="!ping")return m.reply("🏓 PONG!");
 if(x==="!aktywuj")return m.reply("🟢 **BOT JEST AKTYWNY!**");

 if(x==="!lobby")
  return m.channel.send({embeds:[embed("👋 TITAN MARKET",
  "💜 Witaj na Titan Market!\n\n🛒 Sklep\n🎫 Tickety\n⭐ Vouch\n🎁 Dropy\n🎉 Konkursy")]});

 if(x==="!cennik"){
  const b=new ButtonBuilder().setCustomId("ticket").setLabel("Otwórz ticket").setEmoji("🎫").setStyle(ButtonStyle.Primary);
  return m.channel.send({
   embeds:[embed("🛒 CENNIK",
   `${TITAN} **1 TITAN = 1 ZŁ**\n\n🎫 Kliknij przycisk, aby kupić.`)],
   components:[new ActionRowBuilder().addComponents(b)]
  });
 }

 if(x==="!ticket"){
  const menu=new StringSelectMenuBuilder()
   .setCustomId("ticketmenu").setPlaceholder("🎫 Wybierz kategorię")
   .addOptions(
    {label:"Zakup Titan Holo",value:"zakup",emoji:{id:"1536522515092873319",name:"TitanHolo"}},
    {label:"Nagroda",value:"nagroda",emoji:"🎁"},
    {label:"Pomoc",value:"pomoc",emoji:"🛠️"},
    {label:"Współpraca",value:"wsp",emoji:"🤝"}
   );

  return m.channel.send({
   embeds:[embed("🎫 TITAN MARKET",
   `${BLIK} **BLIK — 0%**\n${PSC} **PSC — 15%**\n${MYPSC} **MYPSC — 25%**\n\n🎫 Wybierz kategorię.`)],
   components:[new ActionRowBuilder().addComponents(menu)]
  });
 }

 if(x==="!drop"){
  const b=new ButtonBuilder().setCustomId("drop").setLabel("Wylosuj").setEmoji("🎁").setStyle(ButtonStyle.Primary);
  return m.channel.send({
   embeds:[embed("🎁 DROP TITAN MARKET",
   "🍀 Kliknij **Wylosuj**!\n\n⏳ Cooldown: **2 godziny na osobę**.")],
   components:[new ActionRowBuilder().addComponents(b)]
  });
 }

 if(x==="!legit")
  return m.channel.send({embeds:[embed("⭐ CZY JESTEŚMY LEGIT?",
  "Prawdziwe opinie klientów znajdziesz na kanale **vouch**.")]});

 if(x.startsWith("!potwierdz")){
  if(!admin(m.member))return m.reply("❌ Tylko administracja.");
  const u=m.mentions.users.first(),n=Number(x.split(" ")[2]);
  if(!u||!n)return m.reply("❌ `!potwierdz @klient ilość`");

  legit.set(u.id,n);

  const b=new ButtonBuilder()
   .setCustomId("legit_"+u.id)
   .setLabel("LEGIT")
   .setEmoji("⭐")
   .setStyle(ButtonStyle.Success);

  return m.channel.send({
   embeds:[embed("⭐ POTWIERDZENIE TRANSAKCJI",
   `👤 Klient: ${u}\n🛒 **${n} Titanów**\n💰 **${n} zł**\n\nKliknij **LEGIT**, jeśli wszystko się zgadza.`)],
   components:[new ActionRowBuilder().addComponents(b)]
  });
 }

 if(x==="!daily"){
  const d=new Date().toLocaleDateString("pl-PL");
  return m.reply(`📊 **DAILY**\n🛒 Zakupy dzisiaj: **${daily.get(d)||0}**`);
 }

 if(x==="!zakup"){
  if(!admin(m.member))return m.reply("❌ Tylko administracja.");
  const d=new Date().toLocaleDateString("pl-PL");
  daily.set(d,(daily.get(d)||0)+1);
  return m.reply(`✅ Dodano zakup. Dzisiaj: **${daily.get(d)}**`);
 }
});

bot.on("interactionCreate",async i=>{

 if(i.isButton()&&i.customId==="ticket"){
  const menu=new StringSelectMenuBuilder()
   .setCustomId("ticketmenu").setPlaceholder("🎫 Wybierz kategorię")
   .addOptions(
    {label:"Zakup Titan Holo",value:"zakup",emoji:{id:"1536522515092873319",name:"TitanHolo"}},
    {label:"Nagroda",value:"nagroda",emoji:"🎁"},
    {label:"Pomoc",value:"pomoc",emoji:"🛠️"}
   );
  await i.channel.send({
   embeds:[embed("🎫 TICKET",
   `${BLIK} BLIK — 0%\n${PSC} PSC — 15%\n${MYPSC} MyPSC — 25%\n\n🎫 Wybierz kategorię.`)],
   components:[new ActionRowBuilder().addComponents(menu)]
  });
  return i.reply({content:"🎫 Wybierz kategorię.",ephemeral:true});
 }

 if(i.isButton()&&i.customId==="drop"){
  const last=cd.get(i.user.id)||0,wait=7200000-(Date.now()-last);
  if(wait>0)return i.reply({content:"⏳ Twój drop jest jeszcze na cooldownie 2h.",ephemeral:true});
  cd.set(i.user.id,Date.now());
  return i.reply({
   content:Math.random()<.05?
   "🎉 **GRATULACJE! Wygrałeś 5% zniżki!**":
   "😢 Tym razem się nie udało! Spróbuj za 2 godziny.",
   ephemeral:true
  });
 }

 if(i.isButton()&&i.customId.startsWith("legit_")){
  const id=i.customId.slice(6);
  if(i.user.id!==id)return i.reply({content:"❌ To nie jest Twój przycisk.",ephemeral:true});

  const n=legit.get(id),v=ch(i.guild,"vouch");
  if(!n)return i.reply({content:"❌ Potwierdzenie wygasło.",ephemeral:true});
  if(!v)return i.reply({content:"❌ Brak kanału `vouch`.",ephemeral:true});

  await v.send({embeds:[embed("⭐ NOWY VOUCH",
   `+rep **${i.user.username}**\n\n🛒 **${n} Titanów**\n💰 **${n} zł**\n\n✅ Transakcja potwierdzona.`)]});

  legit.delete(id);
  return i.reply({content:"⭐ Vouch został dodany!",ephemeral:true});
 }

 if(i.isStringSelectMenu()&&i.customId==="ticketmenu"){
  const name="🎫・"+i.values[0]+"-"+i.user.username;
  const c=await i.guild.channels.create({
   name,type:ChannelType.GuildText,
   permissionOverwrites:[
    {id:i.guild.id,deny:[PermissionsBitField.Flags.ViewChannel]},
    {id:i.user.id,allow:[PermissionsBitField.Flags.ViewChannel,PermissionsBitField.Flags.SendMessages]}
   ]
  });

  await c.send({
   content:`${i.user}`,
   embeds:[embed("🎫 TITAN MARKET",
   `${TITAN} **1 TITAN = 1 ZŁ**\n\n${BLIK} BLIK — 0%\n${PSC} PSC — 15%\n${MYPSC} MyPSC — 25%\n\n💬 Napisz, ile Titanów chcesz kupić.\n\n🔒 Ticket zamyka administracja.`)]
  });

  return i.reply({content:`✅ Ticket: ${c}`,ephemeral:true});
 }
});

if(!process.env.TOKEN){
 console.error("❌ BRAK TOKEN!");
 process.exit(1);
}

bot.login(process.env.TOKEN)
 .then(()=>console.log("🔑 DISCORD OK"))
 .catch(e=>{
  console.error("❌ TOKEN ERROR:",e.message);
  process.exit(1);
 });
