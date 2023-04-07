const { GuildMember, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
  name: 'move',
  description: 'move song position in the queue!',
  options: [
    {
      name: 'track',
      type: ApplicationCommandOptionType.Integer,
      description: 'The track number you want to move',
      required: true,
    },
    {
      name: 'position',
      type: ApplicationCommandOptionType.Integer,
      description: 'The position to move it to',
      required: true,
    },
  ],
  async execute(interaction, player) {
    if (!(interaction.member instanceof GuildMember) || !interaction.member.voice.channel) {
      return void interaction.reply({
        content: 'You are not in a voice channel!',
        ephemeral: true,
      });
    }

    if (
      interaction.guild.members.me.voice.channelId &&
      interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId
    ) {
      return void interaction.reply({
        content: 'You are not in my voice channel!',
        ephemeral: true,
      });
    }

    await interaction.deferReply();
    const queue = player.nodes.get(interaction.guildId);
    if (!queue || queue.isEmpty()) return void interaction.followUp({ content: '❌ | There is no song in the queue!' });
    const queueNumbers = [interaction.options.getInteger('track') - 1, interaction.options.getInteger('position') - 1];
    if (queueNumbers[0] > queue.tracks.size || queueNumbers[1] > queue.tracks.size)
      return void interaction.followUp({ content: '❌ | Track number greater than queue depth!' });

    try {
      const track = queue.node.remove(queueNumbers[0]);
      queue.insertTrack(track, queueNumbers[1]);
      return void interaction.followUp({
        content: `✅ | Moved **${track}**!`,
      });
    } catch (error) {
      console.log(error);
      return void interaction.followUp({
        content: '❌ | Something went wrong!',
      });
    }
  },
};
