const { Client, GatewayIntentBits, Collection, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActivityType } = require('discord.js');
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const config = require('./config.json'); // Adjust the path if necessary

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates, // Needed to manage voice states
    ],
});

client.commands = new Collection(); // Collection for message-based commands
client.slashCommands = new Collection(); // Collection for slash commands

const handleCommands = require('./handleCommands');
handleCommands(client);

const handleModalSubmit  = require('./handlePermission'); // Update this path as needed
const config_admin = '1178444979153145866';

const voiceChannelId = '1247287989340606496'; // Replace with your channel ID
const guildId = '1145425767283556532'; // Replace with your guild ID

const BLACKLIST_FILE = path.join(__dirname, 'blacklist.json');

// Function to read the blacklist
async function getBlacklist() {
    try {
        const data = await fs.readFile(BLACKLIST_FILE, 'utf8');
        const json = JSON.parse(data);
        return json.blacklisted || [];
    } catch (err) {
        if (err.code === 'ENOENT') {
            return [];
        } else {
            console.error('Error reading blacklist:', err);
            return [];
        }
    }
}

// Function to join the voice channel automatically
async function joinVoiceChannelAutomatically() {
    try {
        const guild = await client.guilds.fetch(guildId);
        const channel = guild.channels.cache.get(voiceChannelId);

        if (!channel || channel.type !== 2) { // Ensure it's a voice channel
            console.error('Voice channel not found or is not a voice channel.');
            return;
        }

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: false,
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
            console.log('Bot has successfully connected to the voice channel!');
        });

        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
                // Reconnected successfully
            } catch (error) {
                console.log('Reconnecting to the voice channel...');
                joinVoiceChannelAutomatically(); // Attempt to reconnect
            }
        });
    } catch (error) {
        console.error('Error joining voice channel:', error);
    }
}

client.once('ready', async () => {
    console.log('Bot is online and ready!');
    await joinVoiceChannelAutomatically();

    try {
        // Fetch the guild by its ID
        const guild = await client.guilds.fetch('1145425767283556532'); // Replace with your guild ID
        if (guild) {
            const memberCount = guild.memberCount;
            await client.user.setPresence({
                activities: [
                    {
                        name: `Watching over ${memberCount} in Georgia State Roleplay`,
                        type: ActivityType.Watching
                    },
                    {
                        name: `Watching over ${memberCount} in Georgia State Roleplay`,
                        type: ActivityType.Custom,
                        state: `Watching over ${memberCount} in Georgia State Roleplay`
                    }
                ],
                status: 'online',
            });
            console.log(`Activity set to "Watching over ${memberCount} in Georgia State Roleplay" with custom status "Managed by godlygucci"`);
        } else {
            console.log('Guild not found.');
        }
    } catch (error) {
        console.error('Error fetching guild or setting presence:', error);
    }
});

client.on('messageCreate', async message => {
    const prefix = config.prefix; // Ensure prefix is declared in the appropriate scope
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    
    const blacklist = await getBlacklist();
    if (blacklist.includes(message.author.id)) {
        return message.reply('You are blacklisted from using this bot.')
            .then(sentMessage => setTimeout(() => sentMessage.delete(), 1000));
    }
    
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) return;

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error('Error executing command:', error);
        message.reply('There was an error executing that command!');
    }
});

client.on('interactionCreate', async interaction => {
    try {
        const blacklist = await getBlacklist();

        // Check if the user is blacklisted for all types of interactions
        if (blacklist.includes(interaction.user.id)) {
            return interaction.reply({ content: 'You are blacklisted from using this bot.', ephemeral: true });
        }

        if (interaction.isChatInputCommand()) {
            const command = client.slashCommands.get(interaction.commandName);

            if (!command) {
                console.error('Command not found:', interaction.commandName);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('Error executing command:', error);
                await handleInteractionError(interaction);
            }
        } else if (interaction.isButton()) {
            try {
                await handleModalSubmit.execute(interaction);
            } catch (error) {
                console.error('Error handling button interaction:', error);
                await handleInteractionError(interaction);
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'change-prefix-modal') {
                const newPrefix = interaction.fields.getTextInputValue('prefix-input');
                await handlePrefixChange(interaction, newPrefix);
            } else {
                try {
                    await handleModalSubmit.execute(interaction);
                } catch (error) {
                    console.error('Error handling modal interaction:', error);
                    await handleInteractionError(interaction);
                }
            }
        } else if (interaction.isStringSelectMenu()) {
            if (!interaction.member.roles.cache.has(config_admin)) {
                return interaction.reply({ content: 'You do not have the required role to use this menu.', ephemeral: true });
            }
            // Handle select menu interaction here
        } else if (interaction.isContextMenuCommand()) {
            // Handle context menu commands here
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        await handleInteractionError(interaction);
    }
});

// Helper function to handle interaction errors
async function handleInteractionError(interaction) {
    const errorMessage = 'An error occurred while processing your request.';
    if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage, ephemeral: true });
    } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
    }
}

// Helper function to handle prefix changes
async function handlePrefixChange(interaction, newPrefix) {
    const config = require('./config.json');
    config.prefix = newPrefix;
    await fs.writeFile('./config.json', JSON.stringify(config, null, 4));
    await interaction.reply({ content: `Prefix successfully changed to: ${newPrefix}`, ephemeral: true });
}

// Import and use the welcome module
const welcome = require('./erlc/command/events/welcome.js');
welcome(client);

client.login(process.env.TOKEN);




// OFFICIAL BOT OF GEORGIA STATE ROLEPLAY BY ANGEL, GODLYGUCCI.