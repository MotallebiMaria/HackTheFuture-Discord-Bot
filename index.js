// ------ Firebase setup ------
require("dotenv").config();
const admin = require("firebase-admin");
const fs = require('fs');

if (process.env.SERVICE_ACCOUNT_KEY) {
  const keyFilePath = './serviceAccountKey.json';
  
  // decode base64 write it to a file
  const decodedKey = Buffer.from(process.env.SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
  fs.writeFileSync(keyFilePath, decodedKey, 'utf-8');
  console.log('Service account key has been written to the file.');
  
  // initialize Firebase Admin SDK
  const admin = require('firebase-admin');
  admin.initializeApp({
    credential: admin.credential.cert(keyFilePath),
  });
} else {
  console.log("SERVICE_ACCOUNT_KEY environment variable is not set.");
}

// ------ Discord setup ------

const { Client, GatewayIntentBits, Partials, heading, ActivityType} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const PARTICIPANT_ROLE_ID = "1329953543708475443";
const GUILD_ID = "1329940953418563686";
const VERIFICATION_CHANNEL_ID = "1329952372981502074";
const VERIFICATION_MESSAGE_ID = "1329956243804127342";
const REACTION_ROLES_CHANNEL_ID = "1339733893993074759";
const PRONOUNS_MESSAGET_ID = "1340407438691536926";
const YEAR_MESSAGE_ID = "1340407439484518545";
const FIELD_MESSAGE_ID = "1340407440738488421";
const SHE_ROLE_ID = "1339735258207096852";
const HE_ROLE_ID = "1339735317334200331";
const THEY_ROLE_ID = "1339735378847993918";
const ANY_ROLE_ID = "1339735421004812333";
const ASK_ROLE_ID = "1339735502646935663";
const YEAR1_ROLE_ID = "1339734940090109964";
const YEAR2_ROLE_ID = "1339735104842633298";
const YEAR3_ROLE_ID = "1339735141295194224";
const YEAR4_ROLE_ID = "1339735168000462879";
const YEAR5_ROLE_ID = "1339735186635493416";
const CS_ROLE_ID = "1330354765758205982";
const BUSINESS_ROLE_ID = "1330355822357778503";

const pronounRoles = {
  "💛": SHE_ROLE_ID,
  "💚": HE_ROLE_ID,
  "💙": THEY_ROLE_ID,
  "🤷": ANY_ROLE_ID,
  "❓": ASK_ROLE_ID,
};

const yearRoles = {
  "1️⃣": YEAR1_ROLE_ID,
  "2️⃣": YEAR2_ROLE_ID,
  "3️⃣": YEAR3_ROLE_ID,
  "4️⃣": YEAR4_ROLE_ID,
  "🧓": YEAR5_ROLE_ID,
};

const fieldRoles = {
  "💻": CS_ROLE_ID,
  "💼": BUSINESS_ROLE_ID,
};

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setActivity({
    name: "Hacking the future...",
    type: ActivityType.Custom,
  }); 

  // add reaction roles to their posts
  try {
    const pronounsMessage = await client.channels.cache
      .get(REACTION_ROLES_CHANNEL_ID)
      .messages.fetch(PRONOUNS_MESSAGET_ID);
    const yearMessage = await client.channels.cache
      .get(REACTION_ROLES_CHANNEL_ID)
      .messages.fetch(YEAR_MESSAGE_ID);
    const fieldMessage = await client.channels.cache
      .get(REACTION_ROLES_CHANNEL_ID)
      .messages.fetch(FIELD_MESSAGE_ID);

    async function addReactions(message, reactions) {
      for (const emoji of Object.keys(reactions)) {
        if (!message.reactions.cache.has(emoji)) {
          await message.react(emoji);
        }
      }
    }

    await addReactions(pronounsMessage, pronounRoles);
    await addReactions(yearMessage, yearRoles);
    await addReactions(fieldMessage, fieldRoles);

    console.log("Reactions added");
  } catch (error) {
    console.error("Error fetching messages or adding reactions:", error);
  }
});

client.login(process.env.BOT_TOKEN);

// ------ reaction to verification message ------

client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.partial) await reaction.fetch(); // fetch if the reaction is partial

  if (
    reaction.message.id === VERIFICATION_MESSAGE_ID &&
    reaction.message.channel.id === VERIFICATION_CHANNEL_ID &&
    reaction.emoji.name === "✅"
  ) {
    console.log(`Reacted to verif post: ${user.tag}`);

    const member = reaction.message.guild.members.cache.get(user.id);
    if (member) {
      try {
        const participantsRef = db.ref("participants");
        const snapshot = await participantsRef.once("value");
        const participants = snapshot.val();

        // check if discordID already in database
        let alreadyVerified = false;
        for (const key in participants) {
          if (participants.hasOwnProperty(key)) {
            const participantData = participants[key];
            if (participantData.discordID === user.id) {
              alreadyVerified = true;
              break;
            }
          }
        }

        if (alreadyVerified) {
          await user.send(
            "🚫 You have already been verified. Please stop reacting to the verification message. For any other inquiries, please reach out to the moderators.",
          );
          return;
        } else {
          const dmChannel = await user.createDM();
          await dmChannel.send(
            "Thank you for starting the verification process! Please reply to this DM with your registered email address.",
          );
        }
      } catch (error) {
        console.error("Error checking verification for ${user.tag}:", error);
      }
    }
  }
});

// ------ handle verification messages ------

client.on("messageCreate", async (message) => {
  if (message.guild != null || message.author.id == client.user.id) return;

  const email = message.content.trim();
  const discordID = message.author.id;

  console.log(message.author.tag, ' said "', email, '"');

  try {
    const participantsRef = db.ref("participants");
    const snapshot = await participantsRef.once("value");
    const participants = snapshot.val();

    let foundEmail = false;
    let emailAlreadyVerified = false;

    if (participants) {
      for (const key in participants) {
        if (participants.hasOwnProperty(key)) {
          const participantData = participants[key];

          // check if discordID already verified
          if (participantData.discordID === discordID) {
            await message.reply(
              "🚫 You have already been verified. Please stop sending me messages. For any other inquiries, please reach out to the moderators.",
            );
            return;
          }

          // check if email exists & if it's verified
          if (
            participantData.email.toLowerCase().trim() ===
            email.toLowerCase().trim()
          ) {
            // if email already verified, set the flag
            if (participantData.discordID != "-") emailAlreadyVerified = true;
            foundEmail = true;
          }
        }
      }

      if (emailAlreadyVerified) {
        await message.reply("❌ This email has already been verified.");
        return;
      } else if (!foundEmail) {
        await message.reply(
          "❌ Email not found in the database. Please ensure you’re using the email you registered with.",
        );
      } else {
        const guild = client.guilds.cache.get(GUILD_ID);
        const member = guild.members.cache.get(discordID);

        if (member) {
          for (const key in participants) {
            if (participants.hasOwnProperty(key)) {
              const participantData = participants[key];

              // find participant with matching email
              if (
                participantData.email.toLowerCase().trim() ===
                email.toLowerCase().trim()
              ) {
                // update participant info in database
                await participantsRef.child(key).update({
                  discordID: discordID,
                });

                // construct new nickname
                const firstName = participantData.firstName || "FirstName";
                const lastName = participantData.lastName || "LastName";
                const newNickname = `${firstName} ${lastName}`;

                // change user's server nickname
                try {
                  await member.setNickname(newNickname);
                  console.log(
                    `Nickname updated to "${newNickname}" for ${member.user.tag}`,
                  );
                } catch (error) {
                  console.error(
                    `Failed to update nickname for ${member.user.tag}:`,
                    error,
                  );
                }

                // add role and send success message
                await member.roles.add(PARTICIPANT_ROLE_ID);
                // if (participantData.category == "CS") {
                //   await member.roles.add(CS_ROLE_ID);
                // } else {
                //   await member.roles.add(RC_ROLE_ID);
                // }
                await message.reply(
                  "✅ Your verification is complete! Welcome to the hackathon!",
                );

                console.log(
                  "Verified: ",
                  message.author.tag,
                  ", email: ",
                  email,
                );
                break;
              }
            }
          }
        } else {
          await message.reply(
            "❌ It seems like you are not a member of the Hack The Future server, or you have not recently reacted to the verification post. Please ensure you have joined the server using the link sent to your email, then try again by reacting to the verification post.",
          );
        }
      }
    } else {
      console.log("No participants found in database.");
      await message.reply("⚠️ An error occurred. No participants found.");
    }
  } catch (error) {
    console.error("Error during verification:", error);
    await message.reply(
      "⚠️ An error occurred. Please contact a moderator for assistance.",
    );
  }
});

// ------ reaction roles ------

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch(); // fetch if the reaction is partial

  const member = await reaction.message.guild.members.fetch(user.id);
  const emoji_ = reaction.emoji.name;

  if (reaction.message.id === PRONOUNS_MESSAGET_ID) {
    console.log(`Reacted ${emoji_} to pronouns post: ${user.tag}`);
    if (pronounRoles[emoji_]) {
      await member.roles.add(pronounRoles[emoji_]);
    }
  } else if (reaction.message.id === YEAR_MESSAGE_ID) {
    console.log(`Reacted ${emoji_}  to year post: ${user.tag}`);

    if (yearRoles[emoji_]) {
      // remove other reaction & role
      const message = await reaction.message.fetch();
      const userReactions = message.reactions.cache.filter((r) =>
        Object.keys(yearRoles).includes(r.emoji.name),
      );

      for (const userReaction of userReactions.values()) {
        if (userReaction.emoji.name !== reaction.emoji.name) {
          await userReaction.users.remove(user.id);
          await member.roles.remove(yearRoles[userReaction.emoji.name]);
        }
      }

      await member.roles.add(yearRoles[emoji_]);
    }
  } else if (reaction.message.id === FIELD_MESSAGE_ID) {
    if (!member.roles.cache.has(PARTICIPANT_ROLE_ID)) {
      console.log(
        `Tried to react to field post but is not a participant: ${user.tag}`,
      );
      await reaction.users.remove(user.id);
      return;
    }
    console.log(`Reacted ${emoji_} to field post: ${user.tag}`);
    if (fieldRoles[emoji_]) {
      await member.roles.add(fieldRoles[emoji_]);
    }
  }
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch(); // fetch if the reaction is partial

  const member = await reaction.message.guild.members.fetch(user.id);
  const emoji_ = reaction.emoji.name;

  if (reaction.message.id === PRONOUNS_MESSAGET_ID) {
    console.log(`Removed ${emoji_} from pronouns post: ${user.tag}`);
    if (pronounRoles[emoji_]) {
      await member.roles.remove(pronounRoles[emoji_]);
    }
  } else if (reaction.message.id === YEAR_MESSAGE_ID) {
    console.log(`Removed ${emoji_}  from year post: ${user.tag}`);
    if (yearRoles[emoji_]) {
      await member.roles.remove(yearRoles[emoji_]);
    }
  } else if (reaction.message.id === FIELD_MESSAGE_ID) {
    console.log(`Removed ${emoji_} from field post: ${user.tag}`);
    if (fieldRoles[emoji_]) {
      await member.roles.remove(fieldRoles[emoji_]);
    }
  }
});
