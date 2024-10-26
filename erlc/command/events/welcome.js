const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = (client) => {
  client.on('guildMemberAdd', async member => {
    const channelId = '1265080609450233867'; // Replace with your specific channel ID
    const channel = member.guild.channels.cache.get('1147695263272685660');

    if (channel) {
      // Create buttons with dynamic member count

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('Regulations')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://discord.com/channels/${member.guild.id}/${channelId}`),
            // Disable the button to make it unclickable
        );

      // Create a message with dynamic user and member count, including a ping for the user
      await channel.send({
        content: ` <:Halloween23GSRP:1289375215553347707> Welcome <@${member.id}> to **Georgia State Roleplay**! We are now at **${member.guild.memberCount} members**!`,
        components: [row]
      });
    } else {
      console.error('Channel not found!');
    }
  });
};
