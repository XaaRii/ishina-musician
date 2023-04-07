const { GuildMember, SlashCommandBuilder } = require('discord.js');
const { QueueRepeatMode } = require('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('effect')
		.setDescription('Toggles effects!')
		.addStringOption(o => o
			.setName('effect')
			.setDescription('Effect to toggle')
			.setRequired(true)
			.addChoices(
				{ name: '8D', value: '8D' },
				{ name: 'bassboost', value: 'bassboost' },
				{ name: 'compressor', value: 'compressor' },
				{ name: 'earrape', value: 'earrape' },
				{ name: 'karaoke', value: 'karaoke' },
				{ name: 'lofi', value: 'lofi' },
				{ name: 'nightcore', value: 'nightcore' },
				{ name: 'pulsator', value: 'pulsator' },
				{ name: 'reverse', value: 'reverse' },
				{ name: 'tremolo', value: 'tremolo' },
				{ name: 'vaporwave', value: 'vaporwave' },
				{ name: 'vibrato', value: 'vibrato' },
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
			const effects = [], option = interaction.options.getString('effect');
			switch (option) {
				case "bassboost":
					effects.push('bassboost', 'normalizer2')
					break;
				default:
					effects.push(option)
					break;
			}
			
			const success = await queue.filters.ffmpeg.toggle(effects);
			setTimeout(() => {
				return interaction.followUp({
					content: success ?
						`✅ | ${option} ${queue.filters.ffmpeg.isEnabled(option) ? 'enabled' : 'disabled'}!` :
						`❌ | Something went wrong ${interaction.member}... try again?`
				})
			}, queue.node.bufferingTimeout)

		} catch (error) {
			console.log(error);
			interaction.followUp({
				content: 'There was an error trying to execute that command: ' + error.message,
			});
		}
	},
};
