const { GuildMember, SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('View the queue of current songs!'),
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
		var queue = player.nodes.get(interaction.guildId);
		if (typeof (queue) != 'undefined') {
			trimString = (str, max) => ((str.length > max) ? `${str.slice(0, max - 3)}...` : str);
			var qq = queue.tracks.data, numeros = 0;
			qq = qq.slice(0, 35).map(x => {
				numeros++;
				return `${numeros} - ${trimString(x.title, 100)} [${x.duration}] (${trimString(x.requestedBy.username, 30)})`;
				// author: x.author
			});

			return void interaction.reply({
				embeds: [
					{
						title: 'Now Playing',
						description: trimString(`ᴄᴜʀʀᴇɴᴛ ꜱᴏɴɢ: **${queue.currentTrack.title}**! <a:ratjam:1093565443031175198>\n - Queue: -\n${qq.join("\n")}${(queue.tracks.data.length > 35) ? `\n...and ${queue.tracks.data.length - 35} more!` : `...and that's it!`}`, 4095),
					}
				]
			})
		} else {
			return void interaction.reply({
				content: 'There is no song in the queue!'
			})
		}
	}
}
