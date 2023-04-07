const { GuildMember, SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('swap')
		.setDescription('Swap song positions in the queue!')
		.addIntegerOption(o => o
			.setName('track1')
			.setDescription('The track number you want to swap')
			.setRequired(true)
		)
		.addIntegerOption(o => o
			.setName('track2')
			.setDescription('The track number you want to swap')
			.setRequired(true)
		),
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
		const queueNumbers = [interaction.options.getInteger('track1') - 1, interaction.options.getInteger('track2') - 1];
		// Sort so the lowest number is first for swap logic to work
		queueNumbers.sort(function (a, b) {
			return a - b;
		});
		if (!queueNumbers[0] || !queueNumbers[1])
			return void interaction.followUp({ content: '❌ | Track number cannot be zero!' });

		if (queueNumbers[1] > queue.tracks.size)
			return void interaction.followUp({ content: '❌ | Track number greater than queue depth!' });

		try {
			const track2 = queue.node.remove(queueNumbers[1]); // Remove higher track first to avoid list order issues
			const track1 = queue.node.remove(queueNumbers[0]);
			queue.insertTrack(track2, queueNumbers[0]); // Add track in lowest position first to avoid list order issues
			queue.insertTrack(track1, queueNumbers[1]);
			return void interaction.followUp({
				content: `✅ | Swapped **${track1}** & **${track2}**!`,
			});
		} catch (error) {
			console.log(error);
			return void interaction.followUp({
				content: '❌ | Something went wrong!',
			});
		}
	},
};
