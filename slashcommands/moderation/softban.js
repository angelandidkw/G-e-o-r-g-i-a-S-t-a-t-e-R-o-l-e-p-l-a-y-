const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsFilePath = path.resolve(__dirname, 'warnings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('softban')
        .setDescription('Softbans a user (kicks and deletes recent messages)')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to softban')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Number of days of messages to delete (1-7)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the softban')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('target');
        const days = interaction.options.getInteger('days');
        const reason = interaction.options.getString('reason');
        const channelId = '1266070136956391484'; // Replace with the ID of the channel where you want to send the message

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
        }

        const member = interaction.guild.members.cache.get(user.id);
        if (member) {
            try {
                await member.ban({ days, reason });
                await interaction.guild.members.unban(user.id);

                const softbanEmbed = new EmbedBuilder()
                    .setColor('2d2d31')
                    .setTitle(`User Softbanned by ${interaction.user.tag}`)
                    .setThumbnail('https://cdn.discordapp.com/attachments/1245199287210479768/1263188390149361715/image_21.png?ex=66b3b15d&is=66b25fdd&hm=6227917c185e32917810667a1e292b51ab65481367e67f6e0d4954ef42bc9915&')
                    .setDescription(`**${user.tag}** has been softbanned from the server.`)
                    .addFields(
                        { name: 'Reason', value: reason, inline: true },
                        { name: 'Time', value: `${days} day(s)`, inline: true },
                        { name: 'Softbanned By', value: interaction.user.tag, inline: true },
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Softban Action' });

                const channel = interaction.guild.channels.cache.get(channelId);
                if (channel) {
                    await channel.send({ embeds: [softbanEmbed] });

                    // Read existing warnings
                    let warnings = {};
                    if (fs.existsSync(warningsFilePath)) {
                        const data = fs.readFileSync(warningsFilePath);
                        warnings = JSON.parse(data);
                    }

                    // Add the new softban record
                    if (!warnings[user.id]) {
                        warnings[user.id] = [];
                    }
                    warnings[user.id].push({
                        action: 'softban',
                        days: days,
                        reason: reason,
                        softbannedBy: interaction.user.tag,
                        date: new Date().toISOString()
                    });

                    fs.writeFileSync(warningsFilePath, JSON.stringify(warnings, null, 2));

                    // Send DM to the user
                    try {
                        await user.send(`You have been softbanned for the following reason: ${reason}`);
                    } catch (error) {
                        console.error('Error sending DM to the user:', error);
                    }

                    await interaction.reply({ content: 'User has been softbanned and the message has been sent to the specified channel.', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Could not find the specified channel.', ephemeral: true });
                }
            } catch (error) {
                console.error('Error softbanning the user:', error);
                await interaction.reply({ content: 'There was an error trying to softban the user.', ephemeral: true });
            }
        } else {
            await interaction.reply({ content: 'User not found or not in the server.', ephemeral: true });
        }
    }
};

// OFFICIAL BOT OF GEORGIA STATE ROLEPLAY BY ANGEL, GODLYGUCCI.