const { GuildMember, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
	name: 'remove',
	description: 'remove a song from the queue!',
	options: [
		{
			name: 'number',
			type: ApplicationCommandOptionType.Integer,
			description: 'The queue number you want to remove',
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
		const number = interaction.options.getInteger('number') - 1;
		if (number > queue.tracks.size)
			return void interaction.followUp({ content: '❌ | Track number greater than queue depth!' });
		const removedTrack = queue.node.remove(number);
		return void interaction.followUp({
			content: removedTrack ? `✅ | Removed **${removedTrack}**!` : '❌ | Something went wrong!',
		});
	},
};
