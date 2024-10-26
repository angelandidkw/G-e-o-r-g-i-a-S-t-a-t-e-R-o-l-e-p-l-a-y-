const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

const BLACKLIST_FILE = path.join(__dirname, '..', '..', 'blacklist.json'); // Adjust path to be in the root directory
const allowedRoleId = '1178444979153145866'; // Replace with your admin role ID
const protectedUserIds = ['1176361126578094080', '773541293795704842', '1109696998615027752', '777238393422741565', '707706372053008557'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Manage the blacklist')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to the blacklist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to blacklist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from the blacklist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove from the blacklist')
                        .setRequired(true))),
        
    async execute(interaction) {
        // Check if the user has the allowed role
        if (!interaction.member.roles.cache.has(allowedRoleId)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const userId = user.id;

        if (subcommand === 'add') {
            if (protectedUserIds.includes(userId)) {
                return interaction.reply({ content: 'This user cannot be blacklisted.', ephemeral: true });
            }

            try {
                const blacklist = await getBlacklist();
                
                if (blacklist.includes(userId)) {
                    return interaction.reply({ content: 'This user is already blacklisted.', ephemeral: true });
                }

                blacklist.push(userId);
                await saveBlacklist(blacklist);

                return interaction.reply({ content: `User ${user.tag} has been added to the blacklist.`, ephemeral: true });
            } catch (err) {
                console.error('Error updating the blacklist:', err);
                return interaction.reply({ content: 'An error occurred while updating the blacklist.', ephemeral: true });
            }
        }

        if (subcommand === 'remove') {
            try {
                const blacklist = await getBlacklist();

                if (!blacklist.includes(userId)) {
                    return interaction.reply({ content: 'This user is not on the blacklist.', ephemeral: true });
                }

                const updatedBlacklist = blacklist.filter(id => id !== userId);
                await saveBlacklist(updatedBlacklist);

                return interaction.reply({ content: `User ${user.tag} has been removed from the blacklist.`, ephemeral: true });
            } catch (err) {
                console.error('Error updating the blacklist:', err);
                return interaction.reply({ content: 'An error occurred while updating the blacklist.', ephemeral: true });
            }
        }
    }
};

async function getBlacklist() {
    try {
        const data = await fs.readFile(BLACKLIST_FILE, 'utf8');
        const json = JSON.parse(data);
        return json.blacklisted || [];
    } catch (err) {
        if (err.code === 'ENOENT') {
            return [];
        } else {
            throw new Error('Error reading the blacklist file.');
        }
    }
}

async function saveBlacklist(blacklist) {
    const data = JSON.stringify({ blacklisted: blacklist }, null, 2);
    await fs.writeFile(BLACKLIST_FILE, data, 'utf8');
}

// OFFICIAL BOT OF GEORGIA STATE ROLEPLAY BY ANGEL, GODLYGUCCI.