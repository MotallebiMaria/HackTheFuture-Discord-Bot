require('dotenv').config();

// ------ Google setup ------
const { google } = require("googleapis");
const sheets = google.sheets("v4");
const forms = google.forms("v1");
const fs = require('fs');

const SPREADSHEET_ID = "1qg8FDjb5CQRXmxLGDqsNEpZgKuMbNs-Rl4WlABLl4kI";
const FORM_ID = "1u_tpeaz8Z8W5sZaxwqoCu8bTbhkBRQUg82E7lXG90IE";
const FORM_SHEET_ID = "1WJwyPkdE4Lif_eL4B4Vdp61hgLA3HlCjSIO8zOwuNTM";

const keyFilePath = './googleServiceAccountKey.json';

// decode base64-encoded service account key
const decodedKey = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
fs.writeFileSync(keyFilePath, decodedKey, 'utf-8');
console.log('Service account key has been written to the file.');

const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/forms.responses.readonly",
  ],
});

// ------ Discord setup ------
const {
  Client,
  GatewayIntentBits,
  Partials,
  heading,
  ActivityType,
} = require("discord.js");

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

  // start checking for form submissions every 30 seconds
  setInterval(async () => {
    try {
      await processFormSubmissions();
      console.log("Checked for new form submissions.");
    } catch (error) {
      console.error("Error processing form submissions:", error);
    }
  }, 15 * 1000); // 15 s
});

client.login(process.env.BOT_TOKEN);

// ------ selected participant data (for verification) ------
async function getParticipants() {
  const authClient = await auth.getClient();

  const sheetsResponse = await sheets.spreadsheets.values.get({
    auth: authClient,
    spreadsheetId: SPREADSHEET_ID,
    range: "Sheet1!A1:F",
  });

  const rows = sheetsResponse.data.values || [];
  const participants = [];

  for (let i = 1; i < rows.length; i++) {
    const [firstName, lastName, email, discordID, strengths, status] = rows[i];
    participants.push({
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      discordID,
      strengths,
      status,
    });
  }

  return participants;
}

// ------ reaction to verification post ------
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
        const participants = await getParticipants();

        // check if discordID already in spreadsheet
        const alreadyVerified = participants.some(
          (participant) => participant.discordID === user.id,
        );

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
        console.error(`Error checking verification for ${user.tag}:`, error);
      }
    }
  }
});

// ------ handle verification messages ------
async function updateParticipant(participant, discordID) {
  const authClient = await auth.getClient();

  // find row of participant
  const sheetsResponse = await sheets.spreadsheets.values.get({
    auth: authClient,
    spreadsheetId: SPREADSHEET_ID,
    range: "Sheet1!A1:F", // adjust range as needed
  });

  const rows = sheetsResponse.data.values || [];
  const rowIndex = rows.findIndex((row) => row[2] === participant.email);

  if (rowIndex === -1) {
    throw new Error("Participant not found in spreadsheet.");
  }

  // update participant's discordID
  await sheets.spreadsheets.values.update({
    auth: authClient,
    spreadsheetId: SPREADSHEET_ID,
    range: `Sheet1!D${rowIndex + 1}`, // column D
    valueInputOption: "RAW",
    resource: {
      values: [[discordID]],
    },
  });

  // update participant's status
  await sheets.spreadsheets.values.update({
    auth: authClient,
    spreadsheetId: SPREADSHEET_ID,
    range: `Sheet1!F${rowIndex + 1}`, // column F
    valueInputOption: "RAW",
    resource: {
      values: [["Available"]],
    },
  });
}

client.on("messageCreate", async (message) => {
  if (message.guild != null || message.author.id == client.user.id) return;

  const email = message.content.trim().toLowerCase();
  const discordID = message.author.id;

  console.log(message.author.tag, ' said "', email, '"');

  try {
    const participants = await getParticipants();

    let foundEmail = false;
    let emailAlreadyVerified = false;

    for (const participant of participants) {
      // check if discordID already verified
      if (participant.discordID === discordID) {
        await message.reply(
          "🚫 You have already been verified. Please stop sending me messages. For any other inquiries, please reach out to the moderators.",
        );
        return;
      }

      // check if email exists & if it's verified
      if (participant.email === email) {
        // if email already verified, set the flag
        if (participant.discordID !== "-") emailAlreadyVerified = true;
        foundEmail = true;
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
        for (const participant of participants) {
          // find participant with matching email
          if (participant.email === email) {
            // update participant info in the spreadsheet
            await updateParticipant(participant, discordID);

            // construct new nickname
            const firstName = participant.firstName || "FirstName";
            const lastName = participant.lastName || "LastName";
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
            await message.reply(
              "✅ Your verification is complete! Welcome to the hackathon!",
            );

            console.log("Verified: ", message.author.tag, ", email: ", email);

            break;
          }
        }
      } else {
        await message.reply(
          "❌ It seems like you are not a member of the Hack The Future server, or you have not recently reacted to the verification post. Please ensure you have joined the server using the link sent to your email, then try again by reacting to the verification post.",
        );
      }
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
        `Tried to react ${emoji_} to field post but is not a participant: ${user.tag}`,
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

// ------ handling team formation ------
/*
 async function logFormResponses() { // was used to manually get ID for 'Team type' question directly from form
  try {
    const authClient = await auth.getClient();

    const formsResponse = await forms.forms.responses.list({
      auth: authClient,
      formId: FORM_ID,
    });

    const responses = formsResponse.data.responses || [];
    console.log(JSON.stringify(responses, null, 2));
  } catch (error) {
    console.error("Error fetching form responses:", error);
  }
}

logFormResponses();
*/

async function processFormSubmissions() {
  try {
    const authClient = await auth.getClient(); // authenticate with service account

    const formsResponse = await sheets.spreadsheets.values.get({
      auth: authClient,
      spreadsheetId: FORM_SHEET_ID,
      range: "Form Responses 1!A1:H",
    });

    const rows = formsResponse.data.values || [];
    const requests = [];
    const emails = [];

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][7] === "TRUE") {
        continue;
      }
      // columns C-G
      for (let j = 2; j < 7; j++) {
        if (rows[i][j]) {
          emails.push(rows[i][j].trim().toLowerCase());
        }
      }
      await markAsTaken(emails, i);
      console.log(`Processed team #${i} formation:`, emails);

      requests.push({
        updateCells: {
          range: {
            sheetId: 1535622645, // Sheet1 ID
            startRowIndex: i,
            endRowIndex: i + 1,
            startColumnIndex: 7, // column H (Processed?)
            endColumnIndex: 8,
          },
          rows: [
            {
              values: [
                {
                  userEnteredValue: {
                    stringValue: `TRUE`, // update processed status
                  },
                  userEnteredFormat: {
                    horizontalAlignment: "CENTER", // maintain center alignment
                  },
                },
              ],
            },
          ],
          fields: "userEnteredValue,userEnteredFormat.horizontalAlignment", // update value & alignment
        },
      });
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        auth: authClient,
        spreadsheetId: FORM_SHEET_ID,
        resource: {
          requests: requests,
        },
      });
    }
  } catch (error) {
    console.error("Error processing form submissions:", error);
  }
}

async function markAsTaken(emails, teamCount) {
  try {
    const authClient = await auth.getClient(); // authenticate with service account

    // fetch current data from spreadsheet
    const sheetsResponse = await sheets.spreadsheets.values.get({
      auth: authClient,
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A1:F", // adjust range as needed
    });

    const rows = sheetsResponse.data.values || [];
    const requests = [];

    // update status & format rows for "Taken" participants
    for (let i = 1; i < rows.length; i++) {
      // start from row 2
      const participantEmail = rows[i][2]; // email in column 3
      if (emails.includes(participantEmail)) {
        // add a request to update the status column
        requests.push({
          updateCells: {
            range: {
              sheetId: 0, // data is in the first sheet
              startRowIndex: i,
              endRowIndex: i + 1,
              startColumnIndex: 5, // column F (status)
              endColumnIndex: 6,
            },
            rows: [
              {
                values: [
                  {
                    userEnteredValue: {
                      stringValue: `Taken (team #${teamCount})`, // update status w/ team number
                    },
                  },
                ],
              },
            ],
            fields: "userEnteredValue", // only update the cell value
          },
        });

        // add a request to format the row
        requests.push({
          repeatCell: {
            range: {
              sheetId: 0, // data is in the first sheet
              startRowIndex: i,
              endRowIndex: i + 1,
              startColumnIndex: 0, // start from A
              endColumnIndex: 6, // end at F
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: {
                  // medium gray
                  red: 0.8,
                  green: 0.8,
                  blue: 0.8,
                },
              },
            },
            fields: "userEnteredFormat.backgroundColor", // only update background color
          },
        });
      }
    }

    // update spreadsheet with new team count, status, formatting
    await sheets.spreadsheets.batchUpdate({
      auth: authClient,
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: requests,
      },
    });

    console.log("Spreadsheet updated with team information, count, formatting");
  } catch (error) {
    console.error("Error updating spreadsheet with team information:", error);
  }
}
