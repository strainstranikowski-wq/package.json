client.login(process.env.TOKEN)
  .then(() => {
    console.log("✅ TITAN BOT JEST AKTYWNY!");
  })
  .catch((error) => {
    console.error("❌ BŁĄD URUCHAMIANIA BOTA:", error);
  });
