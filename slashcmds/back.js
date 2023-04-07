const { GuildMember } = require('discord.js');

module.exports = {
	name: 'back',
	description: 'Play the previous track!',
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
		if (!queue) return void interaction.followUp({ content: '❌ | There is no song in the queue!' });
		if (!queue.history.previousTrack) return void interaction.followUp({ content: '❌ | There is no previous music in queue!' });
		await queue.history.back()
		return void interaction.followUp({
			content: `✅ | Playing the **previous** track again!`
		});
	},
};
