const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('apply')
        .setDescription('Sends a link to apply for staff'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Staff Application')
            .setDescription('Interested in joining the team? We’re excited to hear from you! 💼\n\nFill out the application form below:')
            .addFields(
                { name: 'Apply Here:', value: '[Staff Application Form](https://docs.google.com/forms/d/e/1FAIpQLSfDL6fLPmqFgGSS8sjlWizS8J6o3NZqkuo5euw7TNeQlaOsOw/viewform)' }
            )
            .setColor('Purple')
            .setFooter({ text: 'Good luck! We look forward to reviewing your application. 😊' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};

// OFFICIAL BOT OF GEORGIA STATE ROLEPLAY BY ANGEL, GODLYGUCCI.