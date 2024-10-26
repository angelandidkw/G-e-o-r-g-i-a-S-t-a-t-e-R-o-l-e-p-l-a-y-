const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giverole')
        .setDescription('Give a role to a user (Only available to a specific user)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to give the role to')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to give')
                .setRequired(true)),
    async execute(interaction) {
        // Check if the user executing the command is the authorized user
        if (interaction.user.id !== '1176361126578094080') {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('⛔ Access Denied')
                .setDescription('You are not authorized to use this command.')
                .setFooter({ text: 'Georgia Utilities | Role Management' });
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const botMember = interaction.guild.members.me;

        // Check if the bot has permissions to manage roles
        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
            const permissionEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⚠️ Permission Error')
                .setDescription('I don\'t have permission to manage roles.')
                .setFooter({ text: 'Georgia Utilities | Role Management' });
            return interaction.reply({ embeds: [permissionEmbed], ephemeral: true });
        }

        // Check if the role is manageable by the bot
        if (role.position >= botMember.roles.highest.position) {
            const hierarchyEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⚠️ Role Hierarchy Issue')
                .setDescription(`I can't assign the role ${role.name} because it's higher than or equal to my highest role. Please move my role above the role you're trying to assign.`)
                .setFooter({ text: 'Georgia Utilities | Role Management' });
            return interaction.reply({ embeds: [hierarchyEmbed], ephemeral: true });
        }

        try {
            const member = await interaction.guild.members.fetch(targetUser.id);
            await member.roles.add(role);
            
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Role Assigned Successfully')
                .setDescription(`Successfully gave the role ${role.name} to ${targetUser.tag}.`)
                .addFields(
                    { name: 'User', value: targetUser.toString(), inline: true },
                    { name: 'Role', value: role.toString(), inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Georgia Utilities | Role Management' });
            
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        } catch (error) {
            console.error('Error giving role:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Error Occurred')
                .setDescription(`An error occurred while trying to give the role.\nError: ${error.message}`)
                .setTimestamp()
                .setFooter({ text: 'Georgia Utilities | Role Management' });
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};

// OFFICIAL BOT OF GEORGIA STATE ROLEPLAY BY ANGEL, GODLYGUCCI.