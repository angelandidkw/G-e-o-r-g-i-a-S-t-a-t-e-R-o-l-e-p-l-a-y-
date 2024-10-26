const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fetch = require('node-fetch'); // Ensure you have node-fetch installed

let sessionActive = true; // Set sessionActive to false when no session is running

const cooldowns = new Map(); // Store cooldowns

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ride-along')
        .setDescription('Create a request embed.')
        .addStringOption(option =>
            option.setName('roblox_username')
                .setDescription('Enter your Roblox username')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('time_available')
                .setDescription('Enter the time for your request (e.g., 14:30 or 2:30 PM)')
                .setRequired(true)),
    async execute(interaction) {
        // Check if session is active
        if (!sessionActive) {
            return interaction.reply({ 
                content: 'No session is currently active. You cannot send this request.', 
                ephemeral: true 
            });
        }

        const roleId = '1173794306511867905';
        const targetRoleId = '1173795597703200799'; // Define targetRoleId here
        const cooldownTime = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        const now = Date.now();

        // Check if the user is on cooldown
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + cooldownTime;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / (60 * 1000); // Convert to minutes
                return interaction.reply({ 
                    content: `You need to wait ${timeLeft.toFixed(1)} more minutes before using this command again.`, 
                    ephemeral: true 
                });
            }
        }

        // Role restriction
        if (!interaction.member.roles.cache.has(roleId)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        // Collect necessary data
        const user = interaction.user;
        const robloxUsername = interaction.options.getString('roblox_username');
        const chosenTime = interaction.options.getString('time_available');

        // Fetch Roblox user info
        const robloxUser = await fetchRobloxUserInfo(robloxUsername);
        if (!robloxUser) {
            return interaction.reply({
                content: `The Roblox username **${robloxUsername}** could not be found. Please check the username and try again.`,
                ephemeral: true
            });
        }

        // Create the embed
        const embed = new EmbedBuilder()
            .setColor('2d2d31')
            .setTitle(`${user.username}'s Ride-Along Request`)
            .setThumbnail('https://cdn.discordapp.com/icons/1145425767283556532/b947aca545a7b23d0079c20b1fd01c29.png?size=512')
            .setDescription(`
                <:info:1175203730392633475> **Roblox Username**: ${robloxUsername} <:WhiteDot:1257871656110784543>
                <:people:1247726625148239954> **Time Available**: ${chosenTime}
            `)
            .setFooter({ text: "Georgia Utilities © " })
            .setTimestamp();

        // Create buttons for actions
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('claim_button')
                    .setLabel('Claim Request')
                    .setStyle(ButtonStyle.Primary)
            );

        // Send the embed and buttons, ping the role
        const message = await interaction.reply({ 
            content: `<@&${targetRoleId}>`, 
            allowedMentions: { parse: ['roles'] },
            embeds: [embed], 
            components: [actionRow],
            fetchReply: true
        });
        
        // Set up the button collector
        const filter = i => i.customId === 'claim_button';
        const collector = message.createMessageComponentCollector({ filter, time: 3600000 }); // 1 hour timeout
        
        collector.on('collect', async i => {
            const claimer = i.user;

            // Check if the claimer is the requester
            if (claimer.id === user.id) {
                return i.reply({ 
                    content: "Ha Ha Why are you accepting your own Ride along?", 
                    ephemeral: true 
                });
            }

            // Check if the claimer has the required role
            if (!i.member.roles.cache.has(targetRoleId)) {
                return i.reply({ 
                    content: "You do not have permission to claim this request.", 
                    ephemeral: true 
                });
            }

            try {
                // Update the embed to show the claimer
                embed.setDescription(`<:info:1175203730392633475> **Roblox Username**: ${robloxUsername} <:WhiteDot:1257871656110784543>\n<:people:1247726625148239954> **Time Available**: ${chosenTime}\n\n**Claimed by**: ${claimer.username}`);
                embed.setThumbnail(claimer.displayAvatarURL({ dynamic: true }));

                await i.update({ embeds: [embed], components: [] });

                // Send DM to claimer with request details
                await claimer.send({
                    content: `You have accepted the ride-along request.`,
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("<:Management:1204253973402615888> Ride-Along Request Details")
                            .setColor('2d2d31')
                            .addFields(
                                { name: '<:info:1175203730392633475> Discord Username', value: `**${user.tag}**`, inline: false },
                                { name: '<:ArrowDown:1272275534465732709> Requester Discord ID', value: `\`${user.id}\``, inline: false },
                                { name: '<:info:1175203730392633475>Roblox Username', value: `**${robloxUsername}**`, inline: false },
                                { name: '<:ArrowDown:1272275534465732709> Roblox ID', value: `\`${robloxUser.id.toString()}\``, inline: false }
                            )
                            .setTimestamp()
                    ]
                });

                // Send DM to the requester with claimer's details
                await user.send({
                    content: `${claimer.username} has accepted your ride-along request!`,
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Ride-Along Request Accepted")
                            .setColor('2d2d31')
                            .addFields(
                                { name: 'Claimer Discord Username', value: claimer.tag, inline: true }
                            )
                            .setTimestamp()
                    ]
                });
            } catch (error) {
                console.error('Error in button interaction:', error);
                await i.reply({ content: 'An error occurred while processing your request. Please try again.', ephemeral: true });
            }
        });
        
        collector.on('end', async collected => {
            if (collected.size === 0) {
                // No one claimed the request
                embed.setDescription('This ride-along request has expired.');
                try {
                    await message.edit({ embeds: [embed], components: [] });
                } catch (error) {
                    if (error.code === 10008) { // Message no longer exists
                        console.log('Unable to edit message: The message was deleted.');
                    } else {
                        console.error('Error editing message:', error);
                    }
                }
            }
        });

        // Set cooldown for the user
        cooldowns.set(interaction.user.id, now);
    }
};

// Function to fetch Roblox user information
async function fetchRobloxUserInfo(username) {
    const API_ENDPOINT = `https://users.roblox.com/v1/usernames/users`;
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usernames: [username],
                excludeBannedUsers: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Check if user data exists in the response
        if (data.data && data.data.length > 0) {
            return data.data[0]; // Return the first valid user
        } else {
            console.error(`Roblox Username not found: ${username}`);
            return null; // Return null if the username wasn't found
        }
    } catch (error) {
        console.error(`Error fetching Roblox user info for ${username}:`, error);
        return null; // Return null if any error occurs
    }
}

// OFFICIAL BOT OF GEORGIA STATE ROLEPLAY BY ANGEL, GODLYGUCCI.