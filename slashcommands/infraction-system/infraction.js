const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const infractionsPath = path.join(__dirname, '..', 'infractions.json');

// Set your constants
const infractionChannelId = '1176776954880458753';
const allowedRoleId = '1244398079852019812';
const appealChannelId = '1145847677653889036';
const logoURL = 'https://cdn.discordapp.com/icons/1145425767283556532/b947aca545a7b23d0079c20b1fd01c29.png?size=512';

// Ensure infractions file exists
if (!fs.existsSync(infractionsPath)) {
    fs.writeFileSync(infractionsPath, JSON.stringify([]));
}

function getNextAvailableId(infractions) {
    let id = 1;
    while (infractions.some(inf => inf.id === id)) {
        id++;
    }
    return id;
}

// Load infractions
let infractions;
try {
    infractions = JSON.parse(fs.readFileSync(infractionsPath));
    if (!Array.isArray(infractions)) {
        infractions = [];
    }
} catch (error) {
    infractions = [];
}

// Function to save infractions
function saveInfractions() {
    fs.writeFileSync(infractionsPath, JSON.stringify(infractions, null, 4));
}

// Function to remove expired infractions
function removeExpiredInfractions() {
    const now = Date.now();
    infractions = infractions.filter(inf => {
        let expirationDate;

        switch (inf.type) {
            case 'Under Investigation':
            case 'Demotion':
            case 'Terminated':
                expirationDate = new Date(inf.date).getTime() + (3 * 7 * 24 * 60 * 60 * 1000); // 3 weeks
                break;
            default:
                expirationDate = new Date(inf.date).getTime() + (2 * 7 * 24 * 60 * 60 * 1000); // Default to 2 weeks
        }

        return now < expirationDate;
    });
    saveInfractions();
}

// Schedule the task to run periodically (e.g., every hour)
setInterval(removeExpiredInfractions, 60 * 60 * 1000);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('infraction')
        .setDescription('Infraction commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View a user\'s infractions')
                .addUserOption(option => option.setName('user').setDescription('The user whose infractions you want to view').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('issue')
                .setDescription('Add an infraction to a user')
                .addUserOption(option => option.setName('user').setDescription('The user to infraction').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('The reason for the infraction').setRequired(true))
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The type of infraction')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Inactivity Notice', value: 'Inactivity Notice'},
                            { name: 'Notice', value: 'Notice' },
                            { name: 'Warning', value: 'Warning' },
                            { name: 'Strike', value: 'Strike' },
                            { name: 'Under Investigation', value: 'Under Investigation' },
                            { name: 'Suspended', value: 'Suspended' },
                            { name: "Demotion", value: "Demotion" },
                            { name: 'Terminated', value: 'Terminated' },
                            { name: 'Blacklisted', value: 'Blacklisted' }
                        ))
                .addStringOption(option => option.setName('notes').setDescription('Additional notes').setRequired(false)),
                
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing infraction')
                .addIntegerOption(option => option.setName('id').setDescription('The infraction ID').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('The new reason for the infraction').setRequired(true))
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The new type of infraction')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Inactivity Notice', value: 'Inactivity Notice'},
                            { name: 'Notice', value: 'Notice' },
                            { name: 'Warning', value: 'Warning' },
                            { name: 'Strike', value: 'Strike' },
                            { name: 'Under Investigation', value: 'Under Investigation' },
                            { name: 'Suspended', value: 'Suspended' },
                            { name: "Demotion", value: "Demotion" },
                            { name: 'Terminated', value: 'Terminated' },
                            { name: 'Blacklisted', value: 'Blacklisted' }
                        ))
                .addStringOption(option => option.setName('notes').setDescription('Additional notes').setRequired(false)),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete an infraction')
                .addIntegerOption(option => option.setName('id').setDescription('The infraction ID').setRequired(true))
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user') || null;
        const id = interaction.options.getInteger('id');
        const reason = interaction.options.getString('reason');
        const type = interaction.options.getString('type');
        const notes = interaction.options.getString('notes') || 'None';

        const username = interaction.member.user.username;
        const avatarURL = interaction.user.displayAvatarURL({ dynamic: true });

        if (!interaction.member.roles.cache.has(allowedRoleId)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const appealButton = new ButtonBuilder()
            .setLabel('Appeal Infraction')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://discord.com/channels/${interaction.guildId}/${appealChannelId}`);

        const infoButton = new ButtonBuilder()
            .setCustomId('info_button')
            .setLabel('Sent from: Georgia State Roleplay')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

        const actionRow = new ActionRowBuilder().addComponents(appealButton, infoButton);

        if (subcommand === 'view') {
            const userInfractions = infractions.filter(inf => inf.userId === user.id);
            if (userInfractions.length === 0) {
                return interaction.reply({ content: `${user.tag} has no infractions.`, ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('Infractions')
                .setDescription(`Staff Member: ${user.tag}`)
                .addFields({ name: 'Infractions:', value: `${userInfractions.length}` })
                .setColor(0x2d2d31)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }));

            userInfractions.forEach(inf => {
                const date = `<t:${Math.floor(new Date(inf.date).getTime() / 1000)}:F>`;
                const issuer = inf.issuerId ? `<@${inf.issuerId}>` : 'N/A';
                const infNotes = inf.notes || 'None';

                embed.addFields(
                    { name: `ID Infraction - ID# ${inf.id}`, value: `**Issued by:** ${issuer}\n**Reason:** ${inf.reason}\n**Punishment:** ${inf.type}\n**Notes:** ${infNotes}\n**Date:** ${date}` }
                );
            });

            return interaction.reply({ embeds: [embed], ephemeral: false });
        }

        if (subcommand === 'issue') {
            await interaction.deferReply({ ephemeral: true });
        
            // Determine expiration based on infraction type
            let expirationTime;
            switch (type) {
                case 'Under Investigation':
                case 'Suspended':
                case 'Demotion':
                case 'Terminated':
                    expirationTime = 3 * 7 * 24 * 60 * 60 * 1000; // 3 weeks
                    break;
                default:
                    expirationTime = 2 * 7 * 24 * 60 * 60 * 1000; // Default to 2 weeks
            }

            // Create the infraction object
            const infraction = {
                id: getNextAvailableId(infractions),
                userId: user.id,
                reason: reason,
                type: type,
                date: new Date().toISOString(),
                expiration: Math.floor((Date.now() + expirationTime) / 1000), // Expiration timestamp in UNIX format
                issuerId: interaction.user.id,
                notes: notes
            };
        
            // Save the infraction
            infractions.push(infraction);
            saveInfractions();
        
            // Create the embed message
            const embed = new EmbedBuilder()
                .setTitle('Staff Punishment')
                .setColor('2d2d31')
                .setThumbnail(logoURL) // Thumbnail for the embed (logo or something else)
                .setAuthor({
                    name: user.username,  // Name of the author
                    iconURL: user.displayAvatarURL({ dynamic: true }),  // Author's avatar
                })
                .addFields(
                    { name: 'Case:', value: `#${infraction.id}`, inline: true },
                    { name: 'Punishment:', value: type, inline: true },
                    { name: 'Date:', value: `<t:${Math.floor(new Date(infraction.date).getTime() / 1000)}:F>`, inline: true },
                    { name: 'Reason:', value: reason, inline: false },
                    { name: 'Notes:', value: notes, inline: false },
                    { name: 'Expiration:', value: `<t:${infraction.expiration}:R>`, inline: false }
                )
                .setFooter({
                    text: `Issued by: ${interaction.user.tag}`, // Footer text with the issuer's tag
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }) // Footer icon URL with the issuer's avatar
                });
        
            try {
                await user.send({
                    embeds: [embed],
                    components: [actionRow]
                });
            } catch (error) {
                console.error(`Could not send DM to ${user.tag}: ${error}`);
            }
        
            const infractionChannel = interaction.client.channels.cache.get(infractionChannelId);
            if (infractionChannel) {
                await infractionChannel.send({ embeds: [embed], components: [actionRow] });
            } else {
                console.error(`Infraction channel with ID ${infractionChannelId} not found.`);
            }
        
            return interaction.editReply({
                content: `${user.tag} has been infracted.`,
                embeds: [embed],
                components: [actionRow],
                ephemeral: true
            });
        }
        
        if (subcommand === 'edit') {
            const infractionIndex = infractions.findIndex(inf => inf.id === id);
            if (infractionIndex === -1) {
                return interaction.reply({ content: `Infraction ID ${id} not found.`, ephemeral: true });
            }

            const infraction = infractions[infractionIndex];
            infraction.reason = reason;
            infraction.type = type;
            infraction.notes = notes;

            saveInfractions();

            const embed = new EmbedBuilder()
                .setTitle('Staff Infraction Update')
                .setColor('2d2d31')
                .setThumbnail(logoURL)
                .setAuthor({
                    name: interaction.user.username,
                    iconURL: avatarURL
                })
                .addFields(
                    { name: 'Punishment:', value: type, inline: true },
                    { name: 'Reason:', value: reason, inline: true },
                    { name: 'Notes:', value: notes, inline: false },
                    { name: 'Date:', value: `<t:${Math.floor(new Date(infraction.date).getTime() / 1000)}:F>`, inline: true },
                    { name: 'Expiration:', value: `<t:${infraction.expiration}:R>`, inline: false }
                )
                .setFooter({ text: `Issued by: ${interaction.user.tag}`, iconURL: avatarURL });

            try {
                const dmUser = await interaction.client.users.fetch(infraction.userId);
                await dmUser.send({
                    embeds: [embed],
                    components: [actionRow]
                });
            } catch (error) {
                console.error(`Could not send DM to ${interaction.client.users.cache.get(infraction.userId).tag}: ${error}`);
            }

            const infractionChannel = interaction.client.channels.cache.get(infractionChannelId);
            if (infractionChannel) {
                await infractionChannel.send({ embeds: [embed], components: [actionRow] });
            } else {
                console.error(`Infraction channel with ID ${infractionChannelId} not found.`);
            }

            return interaction.reply({
                content: `Infraction ID ${id} has been updated.`,
                embeds: [embed],
                components: [actionRow],
                ephemeral: true
            });
        }

        if (subcommand === 'delete') {
            const infractionIndex = infractions.findIndex(inf => inf.id === id);
            if (infractionIndex === -1) {
                return interaction.reply({ content: `Infraction with ID ${id} not found.`, ephemeral: true });
            }

            const [deletedInfraction] = infractions.splice(infractionIndex, 1);
            saveInfractions();

            const embed = new EmbedBuilder()
                .setTitle('Staff Infraction Removal')
                .setColor('2d2d31')
                .setThumbnail(logoURL)
                .setAuthor({
                    name: interaction.user.username,
                    iconURL: avatarURL
                })
                .addFields(
                    { name: 'Punishment:', value: deletedInfraction.type, inline: true },
                    { name: 'Reason:', value: deletedInfraction.reason, inline: true },
                    { name: 'Notes:', value: deletedInfraction.notes || 'None', inline: false },
                    { name: 'Date:', value: `<t:${Math.floor(new Date(deletedInfraction.date).getTime() / 1000)}:F>`, inline: true }
                )
                .setFooter({ text: `Issued by: ${interaction.user.tag}`, iconURL: avatarURL });

            try {
                const dmUser = await interaction.client.users.fetch(deletedInfraction.userId);
                await dmUser.send({
                    embeds: [embed]
                });
            } catch (error) {
                console.error(`Could not send DM to ${interaction.client.users.cache.get(deletedInfraction.userId).tag}: ${error}`);
            }

            const infractionChannel = interaction.client.channels.cache.get(infractionChannelId);
            if (infractionChannel) {
                await infractionChannel.send({ embeds: [embed] });
            } else {
                console.error(`Infraction channel with ID ${infractionChannelId} not found.`);
            }

            return interaction.reply({
                content: `Infraction ID ${id} has been deleted.`,
                embeds: [embed],
                ephemeral: true
            });
        }
    },
};

// OFFICIAL BOT OF GEORGIA STATE ROLEPLAY BY ANGEL, GODLYGUCCI.