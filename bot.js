const {
    Client,
    GatewayIntentBits,
    Collection,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const fs = require('fs');
const config = require('./config.json');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences
    ],
});

client.commands = new Collection();
client.slashCommands = new Collection();

const handleCommands = require('./handleCommands');
handleCommands(client);

const handleModalSubmit = require('./handlePermission');

// Load blacklist from JSON file
let blacklist = [];
try {
    const data = fs.readFileSync('./blacklist.json', 'utf8');
    blacklist = JSON.parse(data).blacklisted;
} catch (err) {
    console.error('Error reading blacklist.json:', err);
}

function isBlacklisted(userId) {
    return blacklist.includes(userId);
}

const voiceChannelId = '1325203506436771910'; // Replace with your channel ID
const guildId = '1145425767283556532'; // Replace with your guild ID

// Function to join the voice channel automatically
async function joinVoiceChannelAutomatically() {
    try {
        const guild = await client.guilds.fetch(guildId);
        const channel = guild.channels.cache.get(voiceChannelId);

        if (!channel || channel.type !== 2) {
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
                    entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5000),
                ]);
            } catch {
                console.log('Reconnecting to the voice channel...');
                joinVoiceChannelAutomatically();
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
        const guild = await client.guilds.fetch(guildId);
        const memberCount = guild.memberCount;
        await client.user.setPresence({
            activities: [{ name: `Watching over ${memberCount} in Georgia State Roleplay.` }],
            status: 'online',
        });
        console.log(`Presence set: Watching over ${memberCount} members.`);
    } catch (error) {
        console.error('Error fetching guild or setting presence:', error);
    }
});

client.on('messageCreate', async message => {
    const prefix = config.prefix;
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    if (isBlacklisted(message.author.id)) {
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
    if (isBlacklisted(interaction.user.id)) {
        return interaction.reply({ content: 'You are blacklisted from using this bot.', ephemeral: true });
    }

    if (interaction.isCommand()) {
        const command = client.slashCommands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('Error executing command:', error);
            await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
        }
    } else if (interaction.isButton()) {
        if (interaction.customId === 'ban_appeal') {
            const modal = new ModalBuilder()
                .setCustomId('ban_appeal_form')
                .setTitle('Ban Appeal')
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('roblox_username')
                            .setLabel('YOUR ROBLOX USERNAME')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                            .setPlaceholder('Enter your Roblox username here...')
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ban_reason')
                            .setLabel('WHY WERE YOU BANNED?')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                            .setPlaceholder('Begin Typing Here...')
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('appeal_reason')
                            .setLabel('WHY SHOULD YOU BE UNBANNED?')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                            .setPlaceholder('Begin Typing Here...')
                            .setMaxLength(750)
                    )
                );

            await interaction.showModal(modal);
        }
    } else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'ban_appeal_form') {
            const username = interaction.fields.getTextInputValue('roblox_username');
            const banReason = interaction.fields.getTextInputValue('ban_reason');
            const appealReason = interaction.fields.getTextInputValue('appeal_reason');

            const appealEmbed = new EmbedBuilder()
                .setTitle('New Ban Appeal')
                .setColor('#FFA500')
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .addFields(
                    { name: 'Discord User', value: `<@${interaction.user.id}>` },
                    { name: 'Roblox Username', value: username },
                    { name: 'Ban Reason', value: banReason },
                    { name: 'Appeal Reason', value: appealReason },
                    { name: 'Status', value: '⏳ Pending Review' }
                )
                .setTimestamp()
                .setFooter({ text: 'Ban Appeal System • Created by GSRP Bot Devs' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`accept_appeal_${interaction.user.id}`)
                    .setLabel('Accept')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`deny_appeal_${interaction.user.id}`)
                    .setLabel('Deny')
                    .setStyle(ButtonStyle.Danger)
            );

            const appealsChannel = interaction.guild.channels.cache.get(process.env.APPEALS_CHANNEL_ID);
            if (appealsChannel) {
                await appealsChannel.send({ embeds: [appealEmbed], components: [row] });
            }

            await interaction.reply({ content: 'Your appeal has been submitted.', ephemeral: true });
        }
    }

    try {
        await handleModalSubmit.execute(interaction);
    } catch (error) {
        console.error('Error handling interaction:', error);
        await interaction.reply({ content: 'There was an error handling this interaction.', ephemeral: true });
    }
});

client.login(process.env.TOKEN);



// OFFICIAL BOT OF GEORGIA STATE ROLEPLAY BY ANGEL, GODLYGUCCI.