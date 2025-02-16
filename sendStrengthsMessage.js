const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const TEST_CHANNEL_ID = "1340400920898437150";
const STRENGTHS_CHANNEL_ID = "1340553298801066056";

client.once("ready", async () => {
  const channel = client.channels.cache.get(STRENGTHS_CHANNEL_ID);

  // general instruction message
  await channel.send(
    "‌📢  ‌Please react to the following messages to specify your strengths and areas of expertise.\nThis information will help all participants in finding their teams.",
  );
  console.log(`instruction message sent.`);

  // tech message
  const techEmbed = new EmbedBuilder()
    .setColor("#3498db") // blue
    .setTitle("Computer Science / Technical:")
    .setDescription(
        "\n" +
        "👨‍💻 ` Software Development / Engineering `\n" +
        "⚙️ ` Backend Development `\n" +
        "🌐 ` Frontend / Web Development `\n" +
        "📱 ` Mobile Development `\n" +
        "💻 ` DevOps / Cloud Engineering `\n" +
        "🔒 ` Cybersecurity `\n" +
        "🤖 ` AI / Machine Learning `\n" +
        "📊 ` Data Science / Analytics `\n" +
        "🧠 ` Natural Language Processing `\n" +
        "📡 ` Networking / Distributed Systems `\n" +
        "🖥️ ` UI/UX Design `",
    );
  const techMessage = await channel.send({ embeds: [techEmbed] });
  console.log(`tech message sent. ID: ${techMessage.id}`);

  // business message
  const businessEmbed = new EmbedBuilder()
    .setColor("#f1c40f") // yellow
    .setTitle("Business / Management:")
    .setDescription(
        "\n" +
        "💡 ` Product Management `\n" +
        "📈 ` Business Analysis / Strategy `\n" +
        "💼 ` Entrepreneurship `\n" +
        "🔍 ` Market Research `\n" +
        "💬 ` Marketing / PR `\n" +
        "📊 ` Data Analytics / Business Intelligence `\n" +
        "💵 ` Finance `\n" +
        "🧑‍💼 ` Consulting `\n" +
        "🔧 ` Operations / Logistics `",
    );
  const businessMessage = await channel.send({ embeds: [businessEmbed] });
  console.log(`business message sent. ID: ${businessMessage.id}`);

  // hybrid message
  const hybridEmbed = new EmbedBuilder()
    .setColor("#2ecc71") // green
    .setTitle("Interdisciplinary / Hybrid Roles:")
    .setDescription(
        "\n" +
        "🛠️ ` Full-Stack Development `\n" +
        "🎨 ` UI/UX / Design Thinking `\n" +
        "🔗 ` Integrations / APIs `\n" +
        "🧑‍💻 ` Tech + Business Strategy `\n" +
        "🚀 ` Startup / Growth Hacking `",
    );
  const hybridMessage = await channel.send({ embeds: [hybridEmbed] });
  console.log(`hybrid message sent. ID: ${hybridMessage.id}`);

  process.exit();
});

client.login(process.env.BOT_TOKEN);