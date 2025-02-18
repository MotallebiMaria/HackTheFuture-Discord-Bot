const { Client, GatewayIntentBits, Team } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const TEST_CHANNEL_ID = "1340400920898437150";
const VERIFICATION_CHANNEL_ID = "1329940953875874006";
const ROLES_CHANNEL_ID = "1339733893993074759";
const STRENGTHS_CHANNEL_ID = "1340553298801066056";
const TEAM_CHANNEL_ID = "1329942931246682133";
const MOD_ROLE_ID = "1329941450569285692";

client.once("ready", async () => {
    const channel = client.channels.cache.get(VERIFICATION_CHANNEL_ID);

    const verifMessage = await channel.send(
        "🎉 **Welcome to Hack The Future 2025!** 🎉\n\n" +
        "We're excited to have you here! Before you dive in, please review the rules and get started using the steps below.\n\n" +
        "📜 **Server Rules:**\n" +
        "- Be Respectful: Treat everyone with kindness. Harassment, discrimination, and hate speech won’t be tolerated.\n" +
        "- Stay On-Topic: Use channels for their intended purposes.\n" +
        "- No Spam: Avoid excessive messaging and self-promotion.\n" +
        "- Privacy Matters: Never share private information (yours or others') publicly.\n\n" +
        "🚀 **Get Started:**\n\n" +
        "1️⃣ **Verification**\n" +
        "If you've been **accepted as a participant**, we have exclusive channels just for you! To gain access:\n\n" +
        "1. React with a ✅ below ONLY if you are an accepted participant.\n" +
        "2. Our bot will privately DM you. Reply with the **email address** you registered with.\n" +
        "3. Once verified, you'll receive the \"HTF 2025 Participant\" role and access to exclusive channels.\n\n" +
        "🛑 **Important**:\n" +
        "- The verification process is ONLY for accepted participants.\n" +
        `- Need help? DM a <@&${MOD_ROLE_ID}> for assistance.\n\n` +
        "After you complete your verification, your server nickname will be changed to `{first_name} {last_name}`.\n\n" +
        `2️⃣ **Grab your roles** from <#${ROLES_CHANNEL_ID}>.\n\n` +
        `3️⃣ **Indicate Your Expertise** in <#${STRENGTHS_CHANNEL_ID}> by reacting to the messages. Your selections will automatically update in our **participant spreadsheet**, making it easier to find teammates with complementary skills.\n\n` +
        "⭐ Here's the **participant spreadsheet**: https://bit.ly/4hDsUl5\n\n" +
        "4️⃣ **Find / Form a Team**\n" +
        `If you don’t have a team yet, check out <#${TEAM_CHANNEL_ID}> to connect with other participants. You can also use the participant spreadsheet to find people with the skills you're looking for. You’re welcome to join an existing team or start your own.\n` +
        "📋 Once your team is finalized, make sure **only one person** fills out [this form](https://forms.gle/xjWEFYqs8LnSwQom9) to register your team.\n\n" +
        "We look forward to see what you’ll build. let’s make this an unforgettable hackathon!\n‌ ‌",
    );
    console.log(`verification message sent. ID: ${verifMessage.id}`);

    process.exit();
});

client.login(process.env.BOT_TOKEN);