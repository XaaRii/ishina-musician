const { GuildMember, SlashCommandBuilder } = require('discord.js');
const { QueueRepeatMode } = require('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('loop')
		.setDescription('Sets loop mode.')
		.addIntegerOption(o => o
			.setName('mode')
			.setDescription('Loop type')
			.setRequired(true)
			.addChoices(
				{ name: 'Off', value: QueueRepeatMode.OFF },
				{ name: 'Track', value: QueueRepeatMode.TRACK },
				{ name: 'Queue', value: QueueRepeatMode.QUEUE },
				{ name: 'Autoplay', value: QueueRepeatMode.AUTOPLAY },
			)
		),
	async execute(interaction, player) {
		try {
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
			if (!queue || !queue.node.isPlaying()) {
				return void interaction.followUp({ content: '❌ | No music is being played!' });
			}

			const loopMode = interaction.options.getInteger('mode');
			const success = queue.setRepeatMode(loopMode);
			const mode = loopMode === QueueRepeatMode.TRACK ? '🔂' : loopMode === QueueRepeatMode.QUEUE ? '🔁' : '▶';

			return void interaction.followUp({
				content: `${mode} | Updated loop mode!`,
			});
		} catch (error) {
			console.log(error);
			interaction.followUp({
				content: 'There was an error trying to execute that command: ' + error.message,
			});
		}
	},
};
