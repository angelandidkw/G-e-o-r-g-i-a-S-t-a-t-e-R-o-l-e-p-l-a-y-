module.exports = async (client, interaction) => {
    if (!interaction.isCommand()) return;
  
    const command = client.slashCommands.get(interaction.commandName);
  
    if (!command) {
      console.error(`Command not found: ${interaction.commandName}`);
      return;
    }
  
    try {
      if (command.data.options.some(option => option.type === 'SUB_COMMAND')) {
        const subcommand = interaction.options.getSubcommand();
  
        if (command.subcommands && command.subcommands[subcommand]) {
          await command.subcommands[subcommand](interaction, client);
        } else {
          console.error(`Subcommand not found: ${subcommand}`);
          await interaction.reply({ content: 'Subcommand not found!', ephemeral: true });
        }
      } else {
        await command.execute(interaction, client);
      }
  
    } catch (error) {
      console.error(`Error executing command ${interaction.commandName}:`, error);
  
      const errorMessage = 'There was an error while executing this command!';
  
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  };
  