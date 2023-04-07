const { GuildMember, SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('volume')
		.setDescription('Change the volume!')
		.addIntegerOption(o => o
			.setName('volume')
			.setDescription('Number between 0-200 (default: 50)')
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
		if (!queue || !queue.node.isPlaying())
			return void interaction.followUp({
				content: '❌ | No music is being played!',
			});

		var volume = interaction.options.getInteger('volume');
		volume = Math.max(0, volume);
		volume = Math.min(200, volume);
		const success = queue.node.setVolume(volume);

		return void interaction.followUp({
			content: success ? `🔊 | Volume set to ${volume}!` : '❌ | Something went wrong...',
		});
	},
};
