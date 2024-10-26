const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsFilePath = path.resolve(__dirname, 'warnings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warns a user in the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for warning the user')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');
        const channelId = '1266070136956391484'; // Replace with the ID of the channel where you want to send the message

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
        }

        const member = interaction.guild.members.cache.get(user.id);
        if (member) {
            const warnEmbed = new EmbedBuilder()
                .setColor('2d2d31')
                .setTitle(`User Warned by ${interaction.user.tag}`)
                .setThumbnail('https://cdn.discordapp.com/attachments/1245199287210479768/1263188390149361715/image_21.png?ex=66b3b15d&is=66b25fdd&hm=6227917c185e32917810667a1e292b51ab65481367e67f6e0d4954ef42bc9915&')
                .setDescription(`**${user.tag}** has been warned.`)
                .addFields(
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Warned By', value: interaction.user.tag, inline: true },
                );

            const channel = interaction.guild.channels.cache.get(channelId);
            if (channel) {
                await channel.send({ embeds: [warnEmbed] });

                // Read existing warnings
                let warnings = {};
                if (fs.existsSync(warningsFilePath)) {
                    const data = fs.readFileSync(warningsFilePath);
                    warnings = JSON.parse(data);
                }

                // Add the new warning
                if (!warnings[user.id]) {
                    warnings[user.id] = [];
                }
                warnings[user.id].push({
                    action: 'warn',
                    reason: reason,
                    warnedBy: interaction.user.id,
                    date: new Date().toISOString()
                });

                // Save the warnings to the JSON file
                fs.writeFileSync(warningsFilePath, JSON.stringify(warnings, null, 2));

                // Send DM to the user
                try {
                    await user.send(`You have been warned for the following reason: ${reason}`);
                } catch (error) {
                    console.error('Error sending DM to the user:', error);
                }

                await interaction.reply({ content: 'User has been warned and the message has been sent to the specified channel.', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Could not find the specified channel.', ephemeral: true });
            }
        } else {
            await interaction.reply({ content: 'User not found or not in the server.', ephemeral: true });
        }
    }
};

// OFFICIAL BOT OF GEORGIA STATE ROLEPLAY BY ANGEL, GODLYGUCCI.