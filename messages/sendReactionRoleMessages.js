const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { TEST_CHANNEL_ID, REACTION_ROLES_CHANNEL_ID } = require('../constants.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once("ready", async () => {
  const channel = client.channels.cache.get(REACTION_ROLES_CHANNEL_ID);

  // general instruction message
  await channel.send(
    "‌📢  ‌React to the following messages to grab your roles!",
  );
  console.log(`instruction message sent.`);

  // pronoun roles message
  const pronounEmbed = new EmbedBuilder()
    .setColor("#3498db") // blue
    .setTitle("📌  Pronouns")
    .setDescription(
      "React with the corresponding emoji(s):\n\n" +
        "💛 ` She/Her `\n" +
        "💚 ` He/Him `\n" +
        "💙 ` They/Them `\n" +
        "🤷 ` Any Pronouns `\n" +
        "❓ ` Ask Me `",
    );
  const pronounMessage = await channel.send({ embeds: [pronounEmbed] });
  console.log(`pronoun message sent. ID: ${pronounMessage.id}`);

  // year roles message
  const yearEmbed = new EmbedBuilder()
    .setColor("#2ecc71") // green
    .setTitle("📌  Year of Study")
    .setDescription(
      "React with your current year of study:\n\n" +
        "1️⃣ ` 1st Year `\n" +
        "2️⃣ ` 2nd Year `\n" +
        "3️⃣ ` 3rd Year `\n" +
        "4️⃣ ` 4th Year `\n" +
        "🧓 ` 5th+ Year `",
    );
  const yearMessage = await channel.send({ embeds: [yearEmbed] });
  console.log(`year message sent. ID: ${yearMessage.id}`);

  // field roles message
  const fieldEmbed = new EmbedBuilder()
    .setColor("#f1c40f") // yellow
    .setTitle("📌  Participating As")
    .setDescription(
      "Select all that apply:\n\n" +
        "💻 ` Computer Science Related Field `\n" +
        "💼 ` Business Related Field `",
    );
  const fieldMessage = await channel.send({ embeds: [fieldEmbed] });
  console.log(`field message sent. ID: ${fieldMessage.id}`);

  process.exit();
});

client.login(process.env.BOT_TOKEN);