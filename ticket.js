const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ChannelType,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    PermissionsBitField,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Collection
} = require("discord.js");
const { createTranscript } = require("discord-html-transcripts");

const userSelections = new Collection(); // Stores user-selected categories

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
                new StringSelectMenuOptionBuilder().setLabel("Billing").setValue("billing"),
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
        const selectedCategory = interaction.values[0];
        userSelections.set(interaction.user.id, selectedCategory);

        return interaction.reply({ content: `✅ You selected **${selectedCategory}**. Now click "Create Ticket"!`, ephemeral: true });
    }

    // ✅ CREATE A TICKET
    if (interaction.isButton() && interaction.customId === "create_ticket") {
        const category = userSelections.get(interaction.user.id);
        if (!category) return interaction.reply({ content: "❌ Please select a category first!", ephemeral: true });

        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: process.env.TicketCategoryID,
            permissionOverwrites: [
                { id: interaction.guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            ],
        });

        let ticketControls = new ActionRowBuilder().addComponents([
            new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId("assign_staff").setLabel("Assign Staff").setEmoji("👤"),
            new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId("close_ticket").setLabel("Close Ticket").setEmoji("✖️"),
            new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId("reopen_ticket").setLabel("Reopen Ticket").setEmoji("🔓"),
            new ButtonBuilder().setStyle(ButtonStyle.Success).setCustomId("transcript_ticket").setLabel("Transcript").setEmoji("📜"),
        ]);

        await ticketChannel.send({
            content: `Ticket created by <@${interaction.user.id}> | Category: **${category}**`,
            components: [ticketControls],
        });

        userSelections.delete(interaction.user.id);
        return interaction.reply({ content: `✅ Ticket created: ${ticketChannel}`, ephemeral: true });
    }

    // ✅ CLOSE TICKET (Admin Only)
    if (interaction.isButton() && interaction.customId === "close_ticket") {
        if (!interaction.member.roles.cache.has(process.env.AdminRoleID)) {
            return interaction.reply({ content: "🚫 Only admins can close tickets!", ephemeral: true });
        }

        await interaction.reply({ content: "Are you sure you want to close this ticket?", ephemeral: true });

        let confirmClose = new ButtonBuilder()
            .setCustomId("confirm_close_ticket")
            .setLabel("Confirm Close")
            .setStyle(ButtonStyle.Danger);

        let cancelClose = new ButtonBuilder()
            .setCustomId("cancel_close_ticket")
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary);

        let row = new ActionRowBuilder().addComponents(confirmClose, cancelClose);
        return interaction.channel.send({ content: "⚠️ **Confirm ticket closure?**", components: [row] });
    }

    // ✅ CONFIRM CLOSURE
    if (interaction.isButton() && interaction.customId === "confirm_close_ticket") {
        await interaction.channel.delete();
    }

    // ✅ TRANSCRIPT SYSTEM
    if (interaction.isButton() && interaction.customId === "transcript_ticket") {
        if (!process.env.TranscriptChannelID) {
            return interaction.reply({ content: "❌ Transcript channel is not set up!", ephemeral: true });
        }

        const transcript = await createTranscript(interaction.channel, {
            limit: -1,
            returnType: "attachment",
            filename: `${interaction.channel.name}.html`,
        });

        const transcriptChannel = interaction.guild.channels.cache.get(process.env.TranscriptChannelID);
        transcriptChannel.send({ content: `📜 Transcript from <#${interaction.channel.id}> by <@${interaction.user.id}>`, files: [transcript] });

        return interaction.reply({ content: "✅ Transcript has been saved!", ephemeral: true });
    }

    // ✅ ASSIGN STAFF (By Discord Username)
    if (interaction.isButton() && interaction.customId === "assign_staff") {
        let modal = new ModalBuilder().setCustomId("assign_staff_modal").setTitle("Assign Staff");

        const staffInput = new TextInputBuilder()
            .setCustomId("staff_username")
            .setLabel("Enter staff Discord Username")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Example: QuantumRP#1234");

        modal.addComponents(new ActionRowBuilder().addComponents(staffInput));
        return await interaction.showModal(modal);
    }

    // ✅ HANDLE STAFF ASSIGNMENT
    if (interaction.isModalSubmit() && interaction.customId === "assign_staff_modal") {
        let staffUsername = interaction.fields.getTextInputValue("staff_username");
        let staff = interaction.guild.members.cache.find(m => m.user.tag === staffUsername);

        if (!staff) {
            return interaction.reply({ content: "❌ User not found! Make sure they are in the server.", ephemeral: true });
        }

        await interaction.channel.permissionOverwrites.edit(staff.id, {
            ViewChannel: true,
            SendMessages: true,
        });

        return interaction.reply({ content: `✅ <@${staff.id}> has been assigned to this ticket!`, ephemeral: false });
    }
};
