const { GuildMember, SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skip a song!'),
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
    const currentTrack = queue.currentTrack;
    const success = queue.node.skip();
    return void interaction.followUp({
      content: success ? `✅ | Skipped **${currentTrack}**!` : '❌ | Something went wrong!',
    });
  },
};
