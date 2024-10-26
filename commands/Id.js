const { EmbedBuilder } = require('discord.js');
const cooldowns = new Map();

module.exports = {
  name: 'id',
  description: 'Replies with the user\'s Discord ID.',
  cooldown: 120, // Cooldown time in seconds (2 minutes)
  async execute(message) {
    try {
      if (!message.content.startsWith('!id') || message.author.bot) return;

      const now = Date.now();
      const cooldownAmount = (this.cooldown || 0) * 1000;

      if (cooldowns.has(message.author.id)) {
        const expirationTime = cooldowns.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          const reply = await message.reply(`Please wait ${timeLeft.toFixed(1)} more seconds before using this command again.`);
          setTimeout(() => reply.delete().catch(console.error), 3000); // Delete after 3 seconds
          return;
        }
      }

      cooldowns.set(message.author.id, now);

      const embed = new EmbedBuilder()
        .setTitle('Your Discord ID')
        .setDescription('Here is your Discord ID:')
        .addFields({ name: 'ID', value: message.author.id })
        .setColor('2d2d31')
        .setFooter({ text: "Georgia Utilities" }); // Pass an object with a text property

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error executing the id command:', error);
    }
  },
};

// OFFICIAL BOT OF GEORGIA STATE ROLEPLAY BY ANGEL, GODLYGUCCI.