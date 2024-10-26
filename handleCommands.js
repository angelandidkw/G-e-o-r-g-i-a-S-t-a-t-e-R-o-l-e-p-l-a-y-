const { REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

module.exports = (client) => {
    client.commandArray = [];

    // Ensure collections are initialized
    if (!client.commands) client.commands = new Collection();
    if (!client.slashCommands) client.slashCommands = new Collection();

    // Function to load commands from a directory
    const loadCommandsFromDirectory = async (directory) => {
        if (!fs.existsSync(directory)) {
            console.warn(`Directory does not exist: ${directory}`);
            return;
        }

        const commandFiles = fs.readdirSync(directory, { withFileTypes: true });

        for (const file of commandFiles) {
            if (file.isDirectory()) {
                await loadCommandsFromDirectory(path.join(directory, file.name));
            } else if (file.name.endsWith('.js')) {
                const command = require(path.join(directory, file.name));
                if (command.data && command.data.name) {
                    client.slashCommands.set(command.data.name, command);
                    client.commandArray.push(command.data.toJSON());
                } else if (command.name) {
                    client.commands.set(command.name, command);
                } else {
                    console.warn(`The command at ${path.join(directory, file.name)} is missing a required "data.name" or "name" property.`);
                }
            }
        }
    };

    // Function to register commands with Discord
    const registerCommands = async () => {
        const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
        try {
            console.log('Started refreshing application (/) commands.');

            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: client.commandArray },
            );

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error('Error while registering commands:', error);
        }
    };

    // Call the function with multiple directories
    (async () => {
        await loadCommandsFromDirectory(path.join(__dirname, 'commands'));
        await loadCommandsFromDirectory(path.join(__dirname, 'slashcommands/command'));
        await loadCommandsFromDirectory(path.join(__dirname, 'slashcommands/moderation'));
        await loadCommandsFromDirectory(path.join(__dirname, 'slashcommands/erlc'));
        await loadCommandsFromDirectory(path.join(__dirname, 'slashcommands/infraction-system'));
        await registerCommands();
    })();
};
