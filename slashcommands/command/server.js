const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { ButtonStyle } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

const ERLC_API_BASE_URL = 'https://api.policeroleplay.community/v1';
const ERLC_SERVER_KEY = process.env.ERLC_SERVER_KEY;
const roleID = '1174846678038224996'; // Replace with the actual role ID you want to ping

const fetchPlayerCount = async () => {
    try {
        const url = `${ERLC_API_BASE_URL}/server`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Server-Key': ERLC_SERVER_KEY
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data.CurrentPlayers || '0';
    } catch (error) {
        console.error('Error fetching player count:', error);
        return 'Unknow';
    }
};

let sessionActive = false;
let votes = [];
let votingLocked = false;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('session')
        .setDescription('Server management commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('shutdown')
                .setDescription('Announces that the server is shutting down.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('vote')
                .setDescription('Initiate a session vote')
                .addIntegerOption(option => 
                    option.setName('votesneeded')
                        .setDescription('Number of votes needed to start the session')
                        .setRequired(true)
                ))
        .addSubcommand(subcommand =>
            subcommand
                .setName('full')
                .setDescription('Announces that the server is full.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('startup')
                .setDescription('Announces that a session has started')),

    /**
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'shutdown') {
            // Shutdown subcommand logic
            console.log('Executing shutdown subcommand');
            const allowedRoleID = '1244109093892001802';
            

            if (allowedRoleID) {
                try {
                    const shutdownTime = Math.floor(Date.now() / 1000);
                    const avatarURL = interaction.user.displayAvatarURL();

                    const embed = new EmbedBuilder()
                        .setColor('2d2d31')
                        .setTitle('Shutdown!')
                        .setDescription('The in-game server has now shut down! During this period, do not join the in-game server or moderation actions may be taken against you! Another session will occur shortly, thank you!')
                        .setFooter({ text: `Requested by ${interaction.member.displayName}`, iconURL: avatarURL })
                        .setImage('https://cdn.discordapp.com/attachments/1244697144754176201/1293754249980940419/image.png?ex=670d2349&is=670bd1c9&hm=81a7c92c0641e41724f94a59955d5ad6cba7326e934569dec1ee21dcbc9f829e&');

                    await interaction.deferReply();

                    const msg = await interaction.followUp({
                        embeds: [embed],
                        fetchReply: true
                    });

                    const interval = setInterval(() => {
                        const relativeTime = `<t:${shutdownTime}:R>`;
                        embed.setDescription(`The in-game server has now shut down! During this period, do not join the in-game server or moderation actions may be taken against you! Another session will occur shortly, thank you!\n\nShutdown: ${relativeTime}`);
                        msg.edit({ embeds: [embed] });
                    }, 1000);

                    setTimeout(() => clearInterval(interval), 60000);

                } catch (error) {
                    console.error('Error sending shutdown message:', error);
                    await interaction.followUp({ content: 'There was an error sending the shutdown message.', ephemeral: true });
                }
            } else {
                await interaction.reply({ content: 'You do not have permission to use this subcommand.', ephemeral: true });
            }
        } else if (subcommand === 'vote') {
            console.log('Executing vote subcommand');

            const requiredPermissions = ["MENTION_EVERYONE", "SEND_MESSAGES"];
            const botPermissions = interaction.channel.permissionsFor(interaction.client.user);
            
            if (!requiredPermissions.every(permission => botPermissions.has(permission))) {
                await interaction.reply({ content: `I need the following permissions to execute this command: ${requiredPermissions.join(", ")}`, ephemeral: true });
                return;
            }
            
            const votesNeeded = interaction.options.getInteger('votesneeded');
            const roleID = '1174846678038224996'; // Replace with the actual role ID you want to ping
            const voteup = Math.floor(Date.now() / 1000);
            const relativeTime = `<t:${voteup}:R>`;
            votes = [];
            votingLocked = false;
            
            const embed = new EmbedBuilder()
                .setColor(2829617)
                .setTitle('<:GSRP:1264351681764655144> | Session Vote:')
                .setDescription(`- A session vote has started! Vote below if you would like to participate within a session. We need ${votesNeeded} votes to start. If you vote during this time, you have to join; otherwise, you will be moderated.\n\n<:Application:1175208995682799616> ~ Votes needed: ${votesNeeded}\n<:Time:1178461073804894258> ~ Vote started: ${relativeTime}`)
                .setImage('https://media.discordapp.net/attachments/1174868806900916304/1259660582693634068/-_-_2024-07-07T200112.416.png');
            
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('vote_yes')
                        .setLabel(`(0/${votesNeeded})`)
                        .setEmoji({ name: 'whitecheck', id: '1267288609598214247' })
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('view_voters')
                        .setLabel('View Voters')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            try {
// Send the embed with voting details and buttons first
await interaction.deferReply();

const followUpMessage = await interaction.followUp({
    embeds: [embed], // Embed with voting details
    components: [row], // Action row with buttons
    fetchReply: true // Fetch the reply to be able to edit later
});

// Introduce a small delay (e.g., 500ms) before sending the ping

// Send the ping message after the delay
await interaction.channel.send({
    content: `Ping: @here <@&${roleID}>`,
    allowedMentions: { parse: ['everyone', 'roles'] } // Allow pings for @here and the role
});
            
                const filter = i => ['vote_yes', 'view_voters'].includes(i.customId) && !i.user.bot;
                const collector = followUpMessage.createMessageComponentCollector({ filter, time: 24 * 60 * 60 * 1000 });
            
                collector.on('collect', async i => {
                    if (i.customId === 'vote_yes') {
                        let replyMessage = '';
                        if (votes.includes(i.user.id)) {
                            votes = votes.filter(voterID => voterID !== i.user.id);
                            replyMessage = 'Your vote has been removed.';
                        } else {
                            votes.push(i.user.id);
                            replyMessage = 'Thank you for your vote!';
                        }
            
                        await i.reply({ content: replyMessage, ephemeral: true });
            
                        embed.setDescription(`- A session vote has started! Vote below if you would like to participate within a session. We need ${votesNeeded} votes to start. If you vote during this time, you have to join; otherwise, you will be moderated.\n\n<:Application:1175208995682799616> ~ Votes needed: ${votesNeeded}\n<:Time:1178461073804894258> ~ Vote started: ${relativeTime}\n\nVotes: ${votes.length}`);
            
                        const rowComponents = [
                            new ButtonBuilder()
                                .setCustomId('vote_yes')
                                .setLabel(`(${votes.length}/${votesNeeded})`)
                                .setEmoji({ name: 'whitecheck', id: '1267288609598214247' })
                                .setStyle(ButtonStyle.Success)
                                .setDisabled(votes.length >= votesNeeded),
                            new ButtonBuilder()
                                .setCustomId('view_voters')
                                .setLabel('View Voters')
                                .setStyle(ButtonStyle.Secondary)
                                                    ];
            
                        if (votes.length >= votesNeeded) {
                            votingLocked = true;
                            sessionActive = false; // Set sessionActive to true when votes are sufficient
                            collector.stop();
                        }
            
                        await followUpMessage.edit({
                            embeds: [embed],
                            components: [new ActionRowBuilder().addComponents(rowComponents)]
                        });
                    } else if (i.customId === 'view_voters') {
                        const voterList = votes.map(voterID => `<@${voterID}>`).join('\n') || 'No votes yet.';
                        await i.reply({ content: `Voters:\n${voterList}`, ephemeral: true });
                    }
                });
            
                collector.on('end', async () => {
                    const lockedRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('vote_yes')
                                .setLabel(`(${votes.length}/${votesNeeded})`)
                                .setEmoji({ name: 'whitecheck', id: '1267288609598214247' })
                                .setStyle(ButtonStyle.Success)
                                .setDisabled(true), // Disable the vote button
                            new ButtonBuilder()
                                .setCustomId('view_voters')
                                .setLabel('View Voters')
                                .setStyle(ButtonStyle.Secondary)// Disable the view voters button
                        );
            
                    await followUpMessage.edit({
                        embeds: [embed],
                        components: [lockedRow],
                        allowedMentions: { parse: ['everyone', 'roles'] }
                    });
                });
            } catch (error) {
                console.error('Error executing vote subcommand:', error);
            
                // Send a reply if there is an error to ensure the interaction is acknowledged
                await interaction.followUp({ content: 'There was an error executing the vote subcommand.', ephemeral: true });
            }
            

        } else if (subcommand === 'full') {
            // Full subcommand logic
            console.log('Executing full subcommand');  
            const startupTime = Math.floor(Date.now() / 1000);
            const embed = new EmbedBuilder()
                .setColor('2d2d31')
                .setTitle('Server Full!')
                .setDescription(`The in-game server is now full! Keep trying to join for some amazing, professional roleplays!\n\n **Got full:** <t:${startupTime}:R>`)
                .setImage('https://cdn.discordapp.com/attachments/1254881224942551132/1283539377905074206/footer_2.png?ex=66e4ae32&is=66e35cb2&hm=160412ebfe04f526348e663ca93bebbaa674f4301912d021d2e7bb2b59924471&');

            try {
                await interaction.deferReply();
                await interaction.followUp({  embeds: [embed], allowedMentions: { parse: ['everyone', 'roles'] } });
            } catch (error) {
                console.error('Error sending server full message:', error);
                await interaction.followUp({ content: 'There was an error sending the server full message.', ephemeral: true });
            }



} else if (subcommand === 'startup') {

    /**
 * Updates the embed with the latest player count and staff count.
 * @param {Message} msg - The message containing the embed to update.
 * @param {Guild} guild - The Discord guild (server) object.
 * @param {EmbedBuilder} embed - The embed to update.
 * @param {number} startupTime - The time the session started, in Unix timestamp format.
 */

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'startup') {
        console.log('Executing startup subcommand');
        const allowedRoleID = '1244109093892001802';
        const targetRoleID = '1176348250261966919'; // Role to check staff count
        const isAllowedUser = interaction.member.roles.cache.has(allowedRoleID);

        if (isAllowedUser) {
            if (sessionActive) {
                await interaction.reply({ content: 'A session is already active.', ephemeral: true });
                return;
            }

            const avatarURL = interaction.user.displayAvatarURL();
            const startupTime = Math.floor(Date.now() / 1000);

            const guild = interaction.guild;
            const updateStaffCount = async () => {
                await guild.members.fetch();
                const membersWithRole = guild.members.cache.filter(member => member.roles.cache.has(targetRoleID));
                return membersWithRole.size;
            };

            let staffCount = await updateStaffCount();
            let playerCount = await fetchPlayerCount();

            const embed = new EmbedBuilder()
                .setTitle(" <:GSRP:1264351681764655144> | Session")
                .setDescription("\n\n - A session has started up! Join up for an immersive and realistic roleplay experience. If you voted during the voting time frame above you are required to join otherwise you will be moderated.\n\n **Server Name:** `Georgia State Roleplay | Strict | Professional`\n **Server Owner:** `Smdball42`\n **Join code:** `gsrp`\n\n**Live Server Information:**")
                .setColor('2d2d31')
                .addFields(
                    { name: "Player Count:", value: `**${playerCount}**`, inline: true },
                    { name: "Staff:", value: `${staffCount}`, inline: true },
                    { name: "Last Updated:", value: `<t:${startupTime}:R>`, inline: true }
                )
                .setImage('https://media.discordapp.net/attachments/919709999423434842/1265846631539019887/footersession.png?ex=66aa3f4b&is=66a8edcb&hm=1b9d34444e32f6989b10f9d888b99ea386e46e39fa3257e958cfcb42955f67a8&format=webp&quality=lossless&width=2880&height=280&')
                .setFooter({ text: `Requested by ${interaction.member.displayName}`, iconURL: avatarURL });

            const joinButton = new ButtonBuilder()
                .setLabel('Quick Join')
                .setStyle(ButtonStyle.Link)
                .setURL('https://policeroleplay.community/join/gsrp');

            const requestPermissionButton = new ButtonBuilder()
                .setCustomId('request_permission')
                .setLabel('Request Permission')
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder()
                .addComponents(joinButton, requestPermissionButton);

            await interaction.deferReply();


            const msg = await interaction.followUp({
                embeds: [embed],
                components: [row], // Add the action row with the buttons
                fetchReply: true
            });   
            
            const finalVoters = votes.map(voterID => `<@${voterID}>`).join('\n') || 'No votes yet.';
            await interaction.followUp({
                content: `Ping: <@&${roleID}> @here\nThe following voters must join or will be moderated!\n Voters:\n${finalVoters}`,
                ephemeral: false
            });


            const filter = i => i.customId === 'request_permission';
            const collector = msg.createMessageComponentCollector({ filter, time: 2 * 24 * 60 * 60 * 1000 }); // 2 days

            collector.on('collect', async i => {
                if (i.customId === 'request_permission') {
                    const modal = new ModalBuilder()
                        .setCustomId('permission_request_modal')
                        .setTitle('Permission Request Form');

                    const robloxUsernameInput = new TextInputBuilder()
                        .setCustomId('roblox_username')
                        .setLabel('Roblox Username')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Enter your Roblox username')
                        .setRequired(true);

                    const durationInput = new TextInputBuilder()
                        .setCustomId('duration')
                        .setLabel('Duration')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Enter the duration (e.g., 1 hour, 30 minutes)')
                        .setRequired(true);

                    const roleplayRequestInput = new TextInputBuilder()
                        .setCustomId('roleplay_request')
                        .setLabel('Roleplay Request')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Enter the roleplay you are requesting')
                        .setRequired(true);

                    const locationInput = new TextInputBuilder()
                        .setCustomId('location')
                        .setLabel('Location (Optional)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Enter the location (if applicable)')
                        .setRequired(false); // This field is optional

                    const firstActionRow = new ActionRowBuilder().addComponents(robloxUsernameInput);
                    const secondActionRow = new ActionRowBuilder().addComponents(durationInput);
                    const thirdActionRow = new ActionRowBuilder().addComponents(roleplayRequestInput);
                    const fourthActionRow = new ActionRowBuilder().addComponents(locationInput);

                    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);

                    await i.showModal(modal);
                }
            });

            const updateEmbed = async () => {
                try {
                    staffCount = await updateStaffCount();
                    playerCount = await fetchPlayerCount();
            
                    const updatedEmbed = new EmbedBuilder(embed)
                        .spliceFields(0, 1, { name: "Player Count:", value: `**${playerCount}**`, inline: true })
                        .spliceFields(1, 1, { name: "Staff:", value: `${staffCount}`, inline: true })
                        .spliceFields(2, 1, { name: "Last Updated:", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true });
            
                    const newJoinButton = new ButtonBuilder()
                        .setLabel('Quick Join')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://policeroleplay.community/join/gsrp');
            
                    const newRequestPermissionButton = new ButtonBuilder()
                        .setCustomId('request_permission')
                        .setLabel('Request Permission')
                        .setStyle(ButtonStyle.Success);
            
                    const newRow = new ActionRowBuilder()
                        .addComponents(newJoinButton, newRequestPermissionButton);
            
                    // Check if the message still exists and is editable
                    if (msg && msg.editable) {
                        await msg.edit({ embeds: [updatedEmbed], components: [newRow] });
                    } else {
                        console.log('Message no longer exists. Stopping interval.');
                        clearInterval(interval);
                    }
                } catch (error) {
                    if (error.code === 10008) { // Unknown Message error
                        console.log('Message no longer exists. Stopping interval.');
                        clearInterval(interval);
                    } else {
                        console.error('Error updating embed:', error);
                    }
                }
            };
// Update every 12 minutes (720000 milliseconds) to refresh buttons before expiration
const interval = setInterval(updateEmbed, 720000);

// Clear interval when the command interaction is destroyed or session ends
interaction.client.on('interactionDelete', (deletedInteraction) => {
    if (deletedInteraction.id === interaction.id) {
        clearInterval(interval);
        sessionActive = false;
    }
});

// Clear interval manually after 24 hours or when session ends
setTimeout(() => clearInterval(interval), 24 * 60 * 60 * 1000); // Stop after 24 hours
            
        } else {
            await interaction.reply({ content: 'You do not have permission to use this subcommand.', ephemeral: true });
        }

    }
}
    }
};
// OFFICIAL BOT OF GEORGIA STATE ROLEPLAY BY ANGEL, GODLYGUCCI.