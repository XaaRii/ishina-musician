const { GuildMember, SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shuffle')
		.setDescription('Shuffle the queue!'),
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
		try {
			queue.tracks.shuffle();
			trimString = (str, max) => ((str.length > max) ? `${str.slice(0, max - 3)}...` : str);
			var qq = queue.tracks.data, numeros = 0;
			qq = qq.slice(0, 35).map(x => {
				numeros++;
				return `${numeros} - ${trimString(x.title, 100)} [${x.duration}] (${trimString(x.requestedBy.username, 30)})`;
				// author: x.author
			});
			return void interaction.followUp({
				embeds: [
					{
						title: 'Now Playing',
						description: trimString(`ᴄᴜʀʀᴇɴᴛ ꜱᴏɴɢ: **${queue.currentTrack.title}**! <:ratjam:1093565443031175198>\n - Queue: -\n${qq.join("\n")}\n...and ${queue.tracks.data.length - 35} more!`, 4095),
					},
				],
			});
		} catch (error) {
			console.log(error);
			return void interaction.followUp({
				content: '❌ | Something went wrong!',
			});
		}
	},
};
