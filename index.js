require('dotenv').config();
const {
    PARTICIPANT_SHEET_ID, FORM_ID, FORM_SHEET_ID, REG_SHEET_ID,
    GUILD_ID, VERIFICATION_CHANNEL_ID, REACTION_ROLES_CHANNEL_ID, STRENGTHS_CHANNEL_ID, PARTICIPANT_ROLE_ID,
    VERIFICATION_MESSAGE_ID, PRONOUNS_MESSAGE_ID, YEAR_MESSAGE_ID, FIELD_MESSAGE_ID, TECH_MESSAGE_ID, BUSINESS_MESSAGE_ID, HYBRID_MESSAGE_ID,
    SHE_ROLE_ID, HE_ROLE_ID, THEY_ROLE_ID, ANY_ROLE_ID, ASK_ROLE_ID,
    YEAR1_ROLE_ID, YEAR2_ROLE_ID, YEAR3_ROLE_ID, YEAR4_ROLE_ID, YEAR5_ROLE_ID, MASTERS_ROLE_ID,
    CS_ROLE_ID, BUSINESS_ROLE_ID,
    FormResponses1_SHEET_ID,
} = require('./constants.js');
const logger = require('./logger.js');

// ------ emojis ------
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
    "5️⃣": YEAR5_ROLE_ID,
    "🧑‍🎓": MASTERS_ROLE_ID,
};
const fieldRoles = {
    "💻": CS_ROLE_ID,
    "💼": BUSINESS_ROLE_ID,
};

const techStrengths = {
    "👨‍💻": "Software Development / Engineering",
    "⚙️": "Backend Development",
    "🌐": "Frontend / Web Development",
    "📱": "Mobile Development",
    "💻": "DevOps / Cloud Engineering",
    "🔒": "Cybersecurity",
    "🤖": "AI / Machine Learning",
    "📊": "Data Science / Analytics",
    "🧠": "Natural Language Processing",
    "📡": "Networking / Distributed Systems",
    "🖥️": "UI/UX Design",
};
const businessStrengths = {
    "💡": "Product Management",
    "📈": "Business Analysis / Strategy",
    "💼": "Entrepreneurship",
    "🔍": "Market Research",
    "💬": "Marketing / PR",
    "📊": "Data Analytics / Business Intelligence",
    "💵": "Finance",
    "🧑‍💼": "Consulting",
    "🔧": "Operations / Logistics",
};
const hybridStrengths = {
    "🛠️": "Full-Stack Development",
    "🎨": "UI/UX / Design Thinking",
    "🔗": "Integrations / APIs",
    "🧑‍💻": "Tech + Business Strategy",
    "🚀": "Startup / Growth Hacking",
};

// ------ Google setup ------
const { google } = require("googleapis");
const sheets = google.sheets("v4");
const forms = google.forms("v1");
const fs = require('fs');

const keyFilePath = './googleServiceAccountKey.json';

// decode base64-encoded service account key
const decodedKey = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
fs.writeFileSync(keyFilePath, decodedKey, 'utf-8');
logger.info('Service account key has been written to the file.');

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

client.on("ready", async () => {
    logger.info(`Logged in as ${client.user.tag}`);

    client.user.setActivity({
        name: "Hacking the future...",
        type: ActivityType.Custom,
    });

    // add reaction roles to their posts
    try {
        const verifMessage = await client.channels.cache
        .get(VERIFICATION_CHANNEL_ID)
        .messages.fetch(VERIFICATION_MESSAGE_ID);
        const pronounsMessage = await client.channels.cache
            .get(REACTION_ROLES_CHANNEL_ID)
            .messages.fetch(PRONOUNS_MESSAGE_ID);
        const yearMessage = await client.channels.cache
            .get(REACTION_ROLES_CHANNEL_ID)
            .messages.fetch(YEAR_MESSAGE_ID);
        const fieldMessage = await client.channels.cache
            .get(REACTION_ROLES_CHANNEL_ID)
            .messages.fetch(FIELD_MESSAGE_ID);
        const techMessage = await client.channels.cache
            .get(STRENGTHS_CHANNEL_ID)
            .messages.fetch(TECH_MESSAGE_ID);
        const businessMessage = await client.channels.cache
            .get(STRENGTHS_CHANNEL_ID)
            .messages.fetch(BUSINESS_MESSAGE_ID);
        const hyrbridMessage = await client.channels.cache
            .get(STRENGTHS_CHANNEL_ID)
            .messages.fetch(HYBRID_MESSAGE_ID);

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
        await addReactions(techMessage, techStrengths);
        await addReactions(businessMessage, businessStrengths);
        await addReactions(hyrbridMessage, hybridStrengths);
        await addReactions(verifMessage, {"✅": "Check"});

        logger.info("Reactions added");
    } catch (error) {
        logger.error("Error fetching messages or adding reactions:", error);
    }

    // start checking for new accepted participants + team form submissions
    setInterval(async () => {
        try {
            await getNewParticipants();
            // logger.info("Checked for new accepted participants.");
        } catch (error) {
            logger.error("Error processing new accepted participants:", error);
        }

        try {
            await processFormSubmissions();
            // logger.info("Checked for new form submissions.");
        } catch (error) {
            logger.error("Error processing form submissions:", error);
        }
    }, 15 * 1000); // 15 s
});

client.login(process.env.BOT_TOKEN);

// ------ selected participant data (for verification) ------
async function getParticipants() {
    const authClient = await auth.getClient();

    const sheetsResponse = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId: PARTICIPANT_SHEET_ID,
        range: "Sheet1!A1:J",
    });

    const rows = sheetsResponse.data.values || [];
    const participants = [];

    for (let i = 1; i < rows.length; i++) {
        const [firstName, prefName, lastName, email, program, strengths, discordID, discordUser, status, teamName] = rows[i];
        participants.push({
            firstName,
            prefName,
            lastName,
            email: email.toLowerCase().trim(),
            program,
            strengths,
            discordID,
            discordUser,
            status,
            teamName,
        });
    }

    return participants;
}

// ------ reaction to verification post ------
client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch(); // fetch if the reaction is partial

    if (
        reaction.message.id === VERIFICATION_MESSAGE_ID &&
        reaction.message.channel.id === VERIFICATION_CHANNEL_ID &&
        reaction.emoji.name === "✅"
    ) {
        logger.info(`Reacted to verif post: ${user.tag}`);

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
                logger.error(`Error checking verification for ${user.tag}:`, error);
            }
        }
    }
});

// ------ handle verification messages ------
async function updateParticipant(participant, discordID, discordUser) {
    const authClient = await auth.getClient();

    // find row of participant
    const sheetsResponse = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId: PARTICIPANT_SHEET_ID,
        range: "Sheet1!A1:J",
    });

    const rows = sheetsResponse.data.values || [];
    const rowIndex = rows.findIndex((row) => row[3] === participant.email);

    if (rowIndex === -1) {
        throw new Error("Participant not found in spreadsheet.");
    }

    // update participant's discordID
    await sheets.spreadsheets.values.update({
        auth: authClient,
        spreadsheetId: PARTICIPANT_SHEET_ID,
        range: `Sheet1!G${rowIndex + 1}`, // column G
        valueInputOption: "RAW",
        resource: {
            values: [[discordID]],
        },
    });

    // update participant's discordUser
    await sheets.spreadsheets.values.update({
        auth: authClient,
        spreadsheetId: PARTICIPANT_SHEET_ID,
        range: `Sheet1!H${rowIndex + 1}`, // column H
        valueInputOption: "RAW",
        resource: {
            values: [[discordUser]],
        },
    });

    // update participant's status
    await sheets.spreadsheets.values.update({
        auth: authClient,
        spreadsheetId: PARTICIPANT_SHEET_ID,
        range: `Sheet1!I${rowIndex + 1}`, // column I
        valueInputOption: "RAW",
        resource: {
            values: [["Available"]],
        },
    });
}

client.on("messageCreate", async (message) => {
    if (message.guild != null || message.author.id == client.user.id) return;

    const email = message.content.trim().toLowerCase(); // Ensure email is lowercase
    const discordID = message.author.id;

    logger.info(`${message.author.tag} said "${email}".`);

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
            if (participant.email.toLowerCase() === email.toLowerCase()) { // Ensure both emails are lowercase
                // if email already verified, set the flag
                if (participant.discordID !== "-") emailAlreadyVerified = true;
                foundEmail = true;
            }
        }

        if (emailAlreadyVerified) {
            await message.reply("❌ This email has already been verified.");
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
                    if (participant.email.toLowerCase().trim() === email.toLowerCase().trim()) { // Ensure both emails are lowercase
                        const discordUser = message.author.tag;
                        // update participant info in the spreadsheet
                        await updateParticipant(participant, discordID, discordUser);

                        // construct new nickname
                        let firstName = participant.firstName || "FirstName";
                        if (participant.prefName) {
                            firstName = participant.prefName;
                        }
                        const lastName = participant.lastName || "LastName";
                        const newNickname = `${firstName} ${lastName}`;

                        // change user's server nickname
                        try {
                            await member.setNickname(newNickname);
                            logger.info(
                                `Nickname updated to "${newNickname}" for ${member.user.tag}`,
                            );
                        } catch (error) {
                            logger.error(
                                `Failed to update nickname for ${member.user.tag}:`,
                                error,
                            );
                        }

                        // add role and send success message
                        await member.roles.add(PARTICIPANT_ROLE_ID);
                        await message.reply(
                            "✅ Your verification is complete! Welcome to the hackathon!",
                        );

                        logger.info(`Verified: "${message.author.tag}", email: "${email}"`);

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
        logger.error("Error during verification:", error);
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

    if (reaction.message.id === PRONOUNS_MESSAGE_ID) {
        logger.info(`Reacted ${emoji_} to pronouns post: ${user.tag}`);
        if (pronounRoles[emoji_]) {
            await member.roles.add(pronounRoles[emoji_]);
        }
    } else if (reaction.message.id === YEAR_MESSAGE_ID) {
        logger.info(`Reacted ${emoji_}    to year post: ${user.tag}`);

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
            logger.info(
                `Tried to react ${emoji_} to field post but is not a participant: ${user.tag}`,
            );
            await reaction.users.remove(user.id);
            return;
        }
        logger.info(`Reacted ${emoji_} to field post: ${user.tag}`);
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

    if (reaction.message.id === PRONOUNS_MESSAGE_ID) {
        logger.info(`Removed ${emoji_} from pronouns post: ${user.tag}`);
        if (pronounRoles[emoji_]) {
            await member.roles.remove(pronounRoles[emoji_]);
        }
    } else if (reaction.message.id === YEAR_MESSAGE_ID) {
        logger.info(`Removed ${emoji_}    from year post: ${user.tag}`);
        if (yearRoles[emoji_]) {
            await member.roles.remove(yearRoles[emoji_]);
        }
    } else if (reaction.message.id === FIELD_MESSAGE_ID) {
        logger.info(`Removed ${emoji_} from field post: ${user.tag}`);
        if (fieldRoles[emoji_]) {
            await member.roles.remove(fieldRoles[emoji_]);
        }
    }
});

async function processFormSubmissions() {
    try {
        const authClient = await auth.getClient(); // authenticate with service account

        const formsResponse = await sheets.spreadsheets.values.get({
            auth: authClient,
            spreadsheetId: FORM_SHEET_ID,
            range: "Form Responses 1!A1:I",
        });

        const rows = formsResponse.data.values || [];
        const requests = [];
        const emails = [];

        for (let i = 1; i < rows.length; i++) {
            if (rows[i][8] === "TRUE") { // column I
                continue;
            }
            // columns C-G
            for (let j = 2; j < 7; j++) {
                if (rows[i][j]) {
                    emails.push(rows[i][j].trim().toLowerCase()); // Ensure emails are lowercase
                }
            }
            let teamName = rows[i][7]; // column H
            await markAsTaken(emails, i, teamName);
            logger.info(`Processed team #${i - 1}: "${teamName}" formation:`, emails);

            requests.push({
                updateCells: {
                    range: {
                        sheetId: FormResponses1_SHEET_ID, // "Form responses 1" ID
                        startRowIndex: i,
                        endRowIndex: i + 1,
                        startColumnIndex: 8, // column I (Processed?)
                        endColumnIndex: 9,
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
        logger.error("Error processing form submissions:", error);
    }
}

async function markAsTaken(emails, teamCount, teamName) {
    try {
        const authClient = await auth.getClient(); // authenticate with service account

        // fetch current data from participant sheet
        const sheetsResponse = await sheets.spreadsheets.values.get({
            auth: authClient,
            spreadsheetId: PARTICIPANT_SHEET_ID,
            range: "Sheet1!A1:J",
        });

        const rows = sheetsResponse.data.values || [];
        const requests = [];

        // update status & format rows for "Taken" participants
        for (let i = 1; i < rows.length; i++) {
            const participantEmail = rows[i][3].toLowerCase().trim(); // Ensure email is lowercase
            if (emails.includes(participantEmail)) { // Ensure emails are lowercase
                // add a request to update the status column
                requests.push({
                    updateCells: {
                        range: {
                            sheetId: 0, // data is in the first sheet
                            startRowIndex: i,
                            endRowIndex: i + 1,
                            startColumnIndex: 8, // column I (status)
                            endColumnIndex: 10,
                        },
                        rows: [
                            {
                                values: [
                                    {
                                        userEnteredValue: {
                                            stringValue: `Taken (team #${teamCount - 1})`, // update status w/ team number
                                        },
                                    },
                                    {
                                        userEnteredValue: {
                                            stringValue: teamName,
                                        }
                                    }
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
                            endColumnIndex: 10, // end at J
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
                        fields: "userEnteredFormat.backgroundColor",
                    },
                });
            }
        }

        // update spreadsheet
        await sheets.spreadsheets.batchUpdate({
            auth: authClient,
            spreadsheetId: PARTICIPANT_SHEET_ID,
            resource: {
                requests: requests,
            },
        });

        logger.info("Spreadsheet updated with team information, count, formatting");
    } catch (error) {
        logger.error("Error updating spreadsheet with team information:", error);
    }
}

// ------ get strengths on Discord ------
client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch(); // fetch if reaction is partial

    const member = await reaction.message.guild.members.fetch(user.id);
    const emoji_ = reaction.emoji.name;

    if (
        reaction.message.id === TECH_MESSAGE_ID ||
        reaction.message.id === BUSINESS_MESSAGE_ID ||
        reaction.message.id === HYBRID_MESSAGE_ID
    ) {
        if (!member.roles.cache.has(PARTICIPANT_ROLE_ID)) {
            logger.info(
                `Tried to react ${emoji_} to strength post but is not a participant: ${user.tag}`,
            );
            await reaction.users.remove(user.id);
            return;
        }

        let strength = "";

        if (reaction.message.id === TECH_MESSAGE_ID) {
            strength = techStrengths[emoji_];
        } else if (reaction.message.id === BUSINESS_MESSAGE_ID) {
            strength = businessStrengths[emoji_];
        } else if (reaction.message.id === HYBRID_MESSAGE_ID) {
            strength = hybridStrengths[emoji_];
        }

        if (strength) {
            logger.info(`Reacted ${emoji_} to strengths post: ${user.tag}`);
            await updateStrengthsInSpreadsheet(user.id, strength, true);
        }
    }
});

client.on("messageReactionRemove", async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch(); // fetch if reaction is partial

    const member = await reaction.message.guild.members.fetch(user.id);
    const emoji_ = reaction.emoji.name;

    if (
        reaction.message.id === TECH_MESSAGE_ID ||
        reaction.message.id === BUSINESS_MESSAGE_ID ||
        reaction.message.id === HYBRID_MESSAGE_ID
    ) {
        if (!member.roles.cache.has(PARTICIPANT_ROLE_ID)) {
            await reaction.users.remove(user.id);
            return;
        }

        let strength = "";

        if (reaction.message.id === TECH_MESSAGE_ID) {
            strength = techStrengths[emoji_];
        } else if (reaction.message.id === BUSINESS_MESSAGE_ID) {
            strength = businessStrengths[emoji_];
        } else if (reaction.message.id === HYBRID_MESSAGE_ID) {
            strength = hybridStrengths[emoji_];
        }

        if (strength) {
            logger.info(`Removed ${emoji_} from strengths post: ${user.tag}`);
            await updateStrengthsInSpreadsheet(user.id, strength, false);
        }
    }
});

// ------ get new accepted participants ------
async function getNewParticipants() {
    try {
        const authClient = await auth.getClient();

        // fetch data from reg sheet
        const regSheetsResponse = await sheets.spreadsheets.values.get({
            auth: authClient,
            spreadsheetId: REG_SHEET_ID,
            range: "Form responses 1!A1:K",
        });

        const rows = regSheetsResponse.data.values || [];
        const requests = [];

        for (let i = 1; i < rows.length; i++) {
            const [isAdded, status, timestamp, email, firstName, prefName, lastName, program] = rows[i];

            let markAccepted = false;
            let teammate = false;
            if ((!status || !status.toLowerCase().trim().includes("accepted")) && status.toLowerCase().trim() !== "duplicate") {
                for (let j = 1; j < rows.length; j++) {
                    if (rows[j][1].toLowerCase().trim() === "accepted" && rows[j][10] && rows[j][10].includes(email)) {
                        markAccepted = true;
                        teammate = true;
                        logger.info(`Found ${email} teammate of ${rows[j][3]}.`);
                        break;
                    }
                }
            } else if (isAdded !== "TRUE") {
                markAccepted = true;
            }

            if (markAccepted) {
                // add to participant sheet
                const appendResponse = await sheets.spreadsheets.values.append({
                    auth: authClient,
                    spreadsheetId: PARTICIPANT_SHEET_ID,
                    range: "Sheet1!A1:J",
                    valueInputOption: "RAW",
                    resource: {
                        values: [[firstName, prefName, lastName, email, program, "", "-", "-", "Not Verified", "-"]],
                    },
                });

                // get row ind of new row
                const updatedRange = appendResponse.data.updates.updatedRange;
                const newRowIndex = updatedRange.split("!")[1].split(":")[0].replace(/[^0-9]/g, "");
                // logger.info("Updated Range:", updatedRange);
                // logger.info("New Row Index (0-based):", newRowIndex);

                // apply borders to all cells in new row
                requests.push({
                    repeatCell: {
                        range: {
                            sheetId: 0,
                            startRowIndex: newRowIndex - 1,
                            endRowIndex: newRowIndex,
                            startColumnIndex: 0,
                            endColumnIndex: 10, // cover columns A-J
                        },
                        cell: {
                            userEnteredFormat: {
                                borders: {
                                    top: { style: "SOLID", width: 1, color: { red: 0, green: 0, blue: 0 } },
                                    bottom: { style: "SOLID", width: 1, color: { red: 0, green: 0, blue: 0 } },
                                    left: { style: "SOLID", width: 1, color: { red: 0, green: 0, blue: 0 } },
                                    right: { style: "SOLID", width: 1, color: { red: 0, green: 0, blue: 0 } },
                                    innerHorizontal: { style: "SOLID", width: 1, color: { red: 0, green: 0, blue: 0 } },
                                    innerVertical: { style: "SOLID", width: 1, color: { red: 0, green: 0, blue: 0 } },
                                },
                            },
                        },
                        fields: "userEnteredFormat.borders",
                    },
                });                

                // mark as added in reg sheet
                await sheets.spreadsheets.values.update({
                    auth: authClient,
                    spreadsheetId: REG_SHEET_ID,
                    range: `Form responses 1!A${i + 1}`,
                    valueInputOption: "RAW",
                    resource: {
                        values: [["TRUE"]],
                    },
                });

                // mark teammates as accepted but differently
                if (teammate) {
                    await sheets.spreadsheets.values.update({
                        auth: authClient,
                        spreadsheetId: REG_SHEET_ID,
                        range: `Form responses 1!B${i + 1}`,
                        valueInputOption: "RAW",
                        resource: {
                            values: [["Accepted (teammate)"]],
                        },
                    });
                }

                logger.info(`Added new participant: ${email}, ${firstName} ${lastName}`);
            }
        }
    } catch (error) {
        logger.error("Error fetching and processing new participants:", error);
    }
}

// ------ update strengths in spreadsheet ------
async function updateStrengthsInSpreadsheet(discordID, strength, add) {
    try {
        const authClient = await auth.getClient();

        // fetch current data from spreadsheet
        const sheetsResponse = await sheets.spreadsheets.values.get({
            auth: authClient,
            spreadsheetId: PARTICIPANT_SHEET_ID,
            range: "Sheet1!A1:J",
        });

        const rows = sheetsResponse.data.values || [];
        const rowIndex = rows.findIndex((row) => row[6] === discordID); // column G

        if (rowIndex === -1) {
            throw new Error("Participant not found in spreadsheet.");
        }

        // get current strengths
        const currentStrengths = rows[rowIndex][5] || ""; // column F
        let updatedStrengths = currentStrengths.split("\n").filter((s) => s !== "");

        if (add) {
            const bulletStrength = `• ${strength}`;
            if (!updatedStrengths.includes(bulletStrength)) {
                updatedStrengths.push(bulletStrength);
            }
        } else {
            const bulletStrength = `• ${strength}`;
            updatedStrengths = updatedStrengths.filter((s) => s !== bulletStrength);
        }

        // update strengths in spreadsheet
        await sheets.spreadsheets.values.update({
            auth: authClient,
            spreadsheetId: PARTICIPANT_SHEET_ID,
            range: `Sheet1!F${rowIndex + 1}`,
            valueInputOption: "RAW",
            resource: {
                values: [[updatedStrengths.join("\n")]],
            },
        });

        logger.info(`Updated strengths for ${discordID}`);
    } catch (error) {
        logger.error("Error updating strengths in spreadsheet:", error);
    }
}
