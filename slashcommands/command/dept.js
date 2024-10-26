const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('application')
        .setDescription('Check the application status for a department')
        .addStringOption(option =>
            option.setName('department')
                .setDescription('The department to check')
                .setRequired(true)
                .addChoices(
                    { name: 'FSCO', value: 'FSCO' },
                    { name: 'AFD', value: 'AFD' },
                    { name: 'GSP', value: 'GSP' },
                    { name: 'APD', value: 'APD' }  // Added APD
                ))
        .addStringOption(option =>
            option.setName('status')
                .setDescription('The application status')
                .setRequired(true)
                .addChoices(
                    { name: 'Accepted', value: 'accepted' },
                    { name: 'Denied', value: 'denied' }
                ))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check the application status for')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('notes')
                .setDescription('Additional notes')
                .setRequired(false)),

    async execute(interaction) {
        const department = interaction.options.getString('department');
        const status = interaction.options.getString('status');
        const targetUser = interaction.options.getUser('user');
        const notes = interaction.options.getString('notes');
        const applicationViewer = interaction.user.id;

        // Embed and role info storage
        const departmentInfo = {
            FSCO: {
                title: 'Fulton County Sheriff\'s Office',
                acceptedImg: 'https://media.discordapp.net/attachments/919709999423434842/1248729045428863048/-_-_2024-06-06T194058.984.png',
                deniedImg: 'https://media.discordapp.net/attachments/919709999423434842/1248729045764411484/-_-_2024-06-06T194122.573.png',
                thumbnail: 'https://media.discordapp.net/attachments/919709999423434842/1248053170777751562/fcso.png',
                color: '#2B2D31',
                roles: ['1246498844594802800', '1245485251413676123']
            },
            AFD: {
                title: 'Atlanta Fire Department',
                acceptedImg: 'https://media.discordapp.net/attachments/919709999423434842/1248729047018639360/-_-_2024-06-07T160240.861.png',
                deniedImg: 'https://media.discordapp.net/attachments/919709999423434842/1248729047379218663/-_-_2024-06-07T160310.759.png',
                thumbnail: 'https://media.discordapp.net/attachments/919709999423434842/1248728530100027565/2SO6mvka51OAAAAAElFTkSuQmCC.png',
                color: '#2B2D31',
                roles: ['1246498874521157644', '1245485251413676123']
            },
            GSP: {
                title: 'Georgia State Patrol',
                acceptedImg: 'https://media.discordapp.net/attachments/919709999423434842/1248409264461058218/-_-_2024-06-06T185226.323.png',
                deniedImg: 'https://media.discordapp.net/attachments/919709999423434842/1248410491043188786/-_-_2024-06-06T185723.913.png',
                thumbnail: 'https://media.discordapp.net/attachments/919709999423434842/1247714830501150730/N5AAAAABJRU5ErkJggg.png',
                color: '#2B2D31',
                roles: ['1246498779612581969', '1245485251413676123']
            },
            APD: {
                title: 'Atlanta Police Department',
                acceptedImg: 'https://cdn.discordapp.com/attachments/1254881224942551132/1295079828990459966/apdbanner_6.png',
                deniedImg: 'https://cdn.discordapp.com/attachments/1254881224942551132/1295079829288390707/apdbanner_7.png',
                thumbnail: 'https://cdn.discordapp.com/icons/1204554522450460742/46a8261dff9d08a2cb5e5de0cbd0d900.png?size=512',
                color: '#2B2D31',
                roles: ['1246498818934181981', '1245485251413676123']  // Replace this with the actual APD role ID
            }
        };

        const departmentData = departmentInfo[department];
        if (!departmentData) {
            return interaction.reply({ content: 'Invalid department', ephemeral: true });
        }

        // Construct the embed based on status
        const embed = new EmbedBuilder()
            .setTitle(departmentData.title)
            .setDescription(`> On behalf of the ${departmentData.title} administration team, we would like to inform you that your application has been **${status}**${status === 'accepted' ? ' into' : ''} the department. ${status === 'accepted' ? 'For more information, head over to the department server.' : 'Feel free to re-apply in the future!'}
                
                <:Application:1244373131657875497> **Application Viewer:** <@${applicationViewer}>${notes ? `\n<:SpeechBubble:1177680381986742302> **Notes:** ${notes}` : ''}`)
            .setThumbnail(departmentData.thumbnail)
            .setImage(status === 'accepted' ? departmentData.acceptedImg : departmentData.deniedImg)
            .setColor(departmentData.color);

        // Assign roles if accepted
        if (status === 'accepted' && departmentData.roles.length > 0) {
            await interaction.guild.members.cache.get(targetUser.id).roles.add(departmentData.roles);
        }

        const targetChannelId = '1175168162635980892';  // Make sure this is the correct channel ID
        const targetChannel = await interaction.guild.channels.cache.get(targetChannelId);

        if (targetChannel) {
            targetChannel.send({ content: `${targetUser}`, embeds: [embed] });
            await interaction.reply({ content: 'Application status has been sent.', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Could not find the target channel.', ephemeral: true });
        }
    }
};

// OFFICIAL BOT OF GEORGIA STATE ROLEPLAY BY ANGEL, GODLYGUCCI.