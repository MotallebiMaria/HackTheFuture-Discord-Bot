const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { REACTION_ROLES_CHANNEL_ID, YEAR_MESSAGE_ID } = require('../constants.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once("ready", async () => {
    const channel = client.channels.cache.get(REACTION_ROLES_CHANNEL_ID);
  
    try {
        // fetch message byID
        const message = await channel.messages.fetch(YEAR_MESSAGE_ID);

        const updatedYearEmbed = new EmbedBuilder()
            .setColor("#2ecc71") // green
            .setTitle("📌  Year of Study")
            .setDescription(
            "React with your current year of study:\n\n" +
                "1️⃣ ` 1st Year `\n" +
                "2️⃣ ` 2nd Year `\n" +
                "3️⃣ ` 3rd Year `\n" +
                "4️⃣ ` 4th Year `\n" +
                "5️⃣ ` 5th+ Year `\n" +
                "🧑‍🎓 ` Masters `\n",
            );
  
        await message.edit({ embeds: [updatedYearEmbed] });
  
        logger.info("Year message edited successfully!");
    } catch (error) {
        logger.info("Failed to edit year message:", error);
    }
  
    process.exit();
});
  
client.login(process.env.BOT_TOKEN);