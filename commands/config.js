const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const config = require('../config.json'); // Adjust the path if necessary

// Define the config_admin role ID
const config_admin = '1178444979153145866'; // Replace with your actual role ID

module.exports = {
    name: 'config',
    description: 'Open the configuration panel',
    async execute(message) {

        // Check if the user has the required role
        if (!message.member.roles.cache.has(config_admin)) {
            return; // Do nothing if the user doesn't have the required role
        }

        // Create the dropdown menu
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('config-select')
            .setPlaceholder('Choose an option')
            .addOptions([
                {
                    label: 'Change Prefix',
                    description: 'Change the bot command prefix',
                    value: 'change_prefix',
                },
                {
                    label: 'Coming Soon',
                    description: 'This option is coming soon',
                    value: 'coming_soon_1',
                },
                {
                    label: 'Coming Soon',
                    description: 'This option is coming soon',
                    value: 'coming_soon_2',
                },
            ]);

        // Create an action row to hold the select menu
        const row = new ActionRowBuilder().addComponents(selectMenu);

        // Create an embed for the panel
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Configuration Panel')
            .setDescription('Please choose an option from the dropdown menu.');

        // Send the panel with the select menu
        await message.reply({ embeds: [embed], components: [row] });
    },
};

// OFFICIAL BOT OF GEORGIA STATE ROLEPLAY BY ANGEL, GODLYGUCCI.