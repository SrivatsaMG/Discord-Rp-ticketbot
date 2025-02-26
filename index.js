const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();
const ticketHandler = require("./ticket");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildIntegrations,
    ],
});

client.once("ready", () => {
    console.log(`${client.user.tag} is online!`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.guild) return;
    await ticketHandler(interaction);
});

client.login(process.env.TOKEN);
