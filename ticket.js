const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ChannelType,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    PermissionsBitField,
    Collection,
    AttachmentBuilder
} = require("discord.js");
const { createTranscript } = require("discord-html-transcripts");

const userSelections = new Collection(); 
let ticketCount = 1; 

module.exports = async (interaction) => {
    if (!interaction.guild) return;

    // ✅ SETUP TICKET PANEL
    if (interaction.isCommand() && interaction.commandName === "setupticket") {
        if (!interaction.member.roles.cache.has(process.env.AdminRoleID)) {
            return interaction.reply({ content: "🚫 You don't have permission to use this!", ephemeral: true });
        }

        let categoryDropdown = new StringSelectMenuBuilder()
            .setCustomId("ticket_category")
            .setPlaceholder("Select a category")
            .addOptions([
                new StringSelectMenuOptionBuilder().setLabel("EDM/Business").setValue("edm_business"),
                new StringSelectMenuOptionBuilder().setLabel("Technical Support").setValue("technical"),
                new StringSelectMenuOptionBuilder().setLabel("General Inquiry").setValue("general"),
            ]);

        let btnrow = new ActionRowBuilder().addComponents([
            new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setCustomId("create_ticket")
                .setLabel("Create Ticket")
                .setEmoji("📑"),
        ]);

        let setupChannel = interaction.guild.channels.cache.get(process.env.TicketSetUpChannel);
        if (!setupChannel) return interaction.reply({ content: "❌ Ticket setup channel is missing!", ephemeral: true });

        setupChannel.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`${process.env.ServerName} | Support Tickets`)
                    .setColor("#00e5ff")
                    .setThumbnail(process.env.Thumbnail)
                    .setImage(process.env.Image)
                    .setFooter({ text: `${process.env.ServerName} | Support`, iconURL: process.env.ServerLogo })
                    .setTimestamp(),
            ],
            components: [new ActionRowBuilder().addComponents(categoryDropdown), btnrow],
        });

        return interaction.reply({ content: `✅ Ticket panel set up in ${setupChannel}`, ephemeral: true });
    }

    // ✅ STORE CATEGORY SELECTION
    if (interaction.isStringSelectMenu() && interaction.customId === "ticket_category") {
        await interaction.deferReply({ ephemeral: true }); 
        const selectedCategory = interaction.values[0];
        userSelections.set(interaction.user.id, selectedCategory);
        await interaction.editReply({ content: `✅ You selected **${selectedCategory}**. Now click "Create Ticket"!` });
    }

    // ✅ CREATE A TICKET
    if (interaction.isButton() && interaction.customId === "create_ticket") {
        const category = userSelections.get(interaction.user.id);
        if (!category) return interaction.reply({ content: "❌ Please select a category first!", ephemeral: true });

        const ticketNumber = String(ticketCount).padStart(3, '0'); 
        ticketCount++; 

        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${ticketNumber}`,
            type: ChannelType.GuildText,
            parent: process.env.TicketCategoryID,
            topic: interaction.user.id, // ✅ Storing User ID in Channel Topic ✅
            permissionOverwrites: [
                { id: interaction.guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                { id: process.env.AdminRoleID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] },
                { id: "1151912982012493864", allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }, 
            ],
        });

        await ticketChannel.send({
            content: `Ticket **#${ticketNumber}** created by <@${interaction.user.id}> | Category: **${category}** | <@&1151912982012493864>`,
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId("close_ticket").setLabel("Close Ticket").setEmoji("✖️"),
                ),
            ],
        });

        if (process.env.DMNotification_Create === "true") {
            interaction.user.send(`✅ **Your ticket has been created!**\n📌 Category: **${category}**\n🔗 Channel: <#${ticketChannel.id}>`);
        }

        userSelections.delete(interaction.user.id);
        return interaction.reply({ content: `✅ Ticket **#${ticketNumber}** created: ${ticketChannel}`, ephemeral: true });
    }

    // ✅ CLOSE TICKET + GENERATE TRANSCRIPT
    if (interaction.isButton() && interaction.customId === "close_ticket") {
        if (!interaction.member.roles.cache.has(process.env.AdminRoleID)) {
            return interaction.reply({ content: "🚫 Only admins can close tickets!", ephemeral: true });
        }

        const closedBy = interaction.user.id; // ✅ Store the user who closed the ticket
        const ticketCreatorId = interaction.channel.topic; 
        const creatorMention = ticketCreatorId ? `<@${ticketCreatorId}>` : "Unknown User"; 

        const transcript = await createTranscript(interaction.channel, {
            returnType: "attachment",
            filename: `${interaction.channel.name}.html`,
        });

        const transcriptChannel = interaction.guild.channels.cache.get(process.env.TranscriptChannelID);
        if (transcriptChannel) {
            transcriptChannel.send({
                content: `📜 **Transcript from Ticket #${interaction.channel.name.replace("ticket-", "")}**\n🎟️ **Created by:** ${creatorMention}\n🔒 **Closed by:** <@${closedBy}>`,
                files: [transcript]
            });
        }

        if (process.env.DMNotification_Transcript === "true") {
            if (ticketCreatorId) {
                const user = await interaction.guild.members.fetch(ticketCreatorId).catch(() => null);
                if (user) {
                    user.send({
                        content: `📜 **Your ticket transcript is ready!**\n🎟️ **Ticket Number:** #${interaction.channel.name.replace("ticket-", "")}\n🔒 **Closed by:** <@${closedBy}>`,
                        files: [transcript]
                    }).catch(() => console.log("DM Failed"));
                }
            }
        }

        await interaction.channel.delete();
    }
};
