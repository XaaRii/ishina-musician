const { GuildMember, ApplicationCommandOptionType } = require('discord.js');
const { QueryType } = require('discord-player');

module.exports = {
	name: 'playtop',
	description: 'Play a song before the next in your channel!',
	options: [
		{
			name: 'query',
			type: ApplicationCommandOptionType.String,
			description: 'The song you want to play',
			required: true,
		},
	],
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

			const query = interaction.options.getString('query');
			const searchResult = await player.search(query, {
				requestedBy: interaction.user,
				searchEngine: QueryType.AUTO,
			}).catch(() => { });
			if (!searchResult.hasTracks())
				return void interaction.followUp({ content: 'No results were found!' });

			const queue = await player.nodes.create(interaction.guildId, {
				metadata: {
					channel: interaction.channel,
					client: interaction.guild.members.me,
					requestedBy: interaction.user
				},
				selfDeaf: true,
				volume: 50,
				leaveOnEmpty: true,
				leaveOnEmptyCooldown: 300000,
				leaveOnEnd: true,
				leaveOnEndCooldown: 300000,
				ytdlOptions: {
					quality: "highest",
					filter: "audioonly",
					highWaterMark: 1 << 25,
					dlChunkSize: 0,
				},
			});

			try {
				if (!queue.connection) await queue.connect(interaction.member.voice.channel);
			} catch {
				void player.nodes.delete(interaction.guildId);
				return void interaction.followUp({
					content: 'Could not join your voice channel!',
				});
			}

			await interaction.followUp({
				content: `⏱ | Loading your ${searchResult.playlist ? 'playlist' : 'track'}...`,
			});
			searchResult.playlist ? queue.insertTrack(searchResult.tracks, 0) : queue.insertTrack(searchResult.tracks[0], 0);
			if (!queue.node.isPlaying()) await queue.play();
		} catch (error) {
			console.log(error);
			interaction.followUp({
				content: 'There was an error trying to execute that command: ' + error.message,
			});
		}
	},
};
