const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsFilePath = path.resolve(__dirname, 'warnings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('viewmoderation')
        .setDescription('View infractions of a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user whose infractions you want to view')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('target');

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
        }

        // Read existing warnings
        let warnings = {};
        if (fs.existsSync(warningsFilePath)) {
            const data = fs.readFileSync(warningsFilePath);
            warnings = JSON.parse(data);
        }

        const userInfractions = warnings[user.id] || [];
        if (userInfractions.length === 0) {
            return interaction.reply({ content: `${user.tag} has no infractions.`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('Moderation')
            .setDescription(`Member: ${interaction.user.tag}`)
            .addFields({ name: 'Moderations:', value: `${userInfractions.length}` })
            .setColor(0x2d2d31)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }));

        userInfractions.forEach((inf, index) => {
            const date = `<t:${Math.floor(new Date(inf.date).getTime() / 1000)}:F>`;
            const issuer = inf.warnedBy ? `<@${inf.warnedBy}>` : 'N/A';
            embed.addFields(
                { name: `Moderation ${index + 1}:`, value: `**Issued by:** ${issuer}\n**Reason:** ${inf.reason}\n**Date:** ${date}` }
            );
        });

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};

// OFFICIAL BOT OF GEORGIA STATE ROLEPLAY BY ANGEL, GODLYGUCCI.