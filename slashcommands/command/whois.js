const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whois')
        .setDescription('Displays detailed information about a user')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user to get information about')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('target');
        const member = await interaction.guild.members.fetch(user.id);

        // Join dates
        const accountCreationDate = user.createdAt;
        const serverJoinDate = member.joinedAt;

        // Roles
        const roles = member.roles.cache
            .filter(role => role.id !== interaction.guild.id)
            .map(role => role.toString())
            .join(', ');

        // Permissions
        const permissions = new PermissionsBitField(member.permissions).toArray().map(permission => {
            return permission.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
        }).join(', ');

        const embed = new EmbedBuilder()
            .setTitle(`${user.tag} - User Information`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'User Mention', value: `${user}`, inline: true },
                { name: 'Display Name', value: `${member.displayName}`, inline: true },
                { name: 'Joined Server', value: `${serverJoinDate.toLocaleDateString()} at ${serverJoinDate.toLocaleTimeString()} (${Math.floor((Date.now() - serverJoinDate) / (1000 * 60 * 60 * 24 * 30))} months ago)`, inline: false },
                { name: 'Account Created', value: `${accountCreationDate.toLocaleDateString()} at ${accountCreationDate.toLocaleTimeString()} (${Math.floor((Date.now() - accountCreationDate) / (1000 * 60 * 60 * 24 * 365))} years ago)`, inline: false },
                { name: 'Roles', value: roles || 'None', inline: false },
                { name: 'Permissions', value: permissions || 'None', inline: false }
            )
            .setColor('Random')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
// OFFICIAL BOT OF GEORGIA STATE ROLEPLAY BY ANGEL, GODLYGUCCI.