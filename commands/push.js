const request = require(`request`);
const fs = require(`fs`);
const config = require('../.cfg.json');
var annoyers = [],
	gifs = [
		"https://tenor.com/view/wtf-is-this-like-jajaja-gif-3429524",
		"https://tenor.com/view/push-building-gif-15464450",
		"https://tenor.com/view/fall-cliff-gif-5306381",
		"https://tenor.com/view/falling-tumble-free-fall-slam-hit-gif-17190088",
		"https://tenor.com/view/star-trek-star-trek-tos-fall-cliff-gif-18131304",
		"https://tenor.com/view/push-gif-5358919",
		"https://tenor.com/view/shishiro-botan-throws-omaru-polka-push-off-cliff-yeets-gif-25058803",
		"https://tenor.com/view/off-a-cliff-off-the-cliff-cliff-wheelchair-greg-abbott-gif-25830019",
	];
module.exports = {
	name: 'push',
	description: `Sends file. Owner only!`,
	aliases: ['sendfile', 'sendf'],
	usage: `<where? path>`,
	showHelp: false,
	async execute(message, args) {
		if (!config.admins.includes(message.author.id)) {
			if (annoyers.includes(message.author.id)) return message.reply(gifs[Math.floor(Math.random() * gifs.length)]);
			else {
				annoyers.push(message.author.id);
				message.reply("I'm gonna push you off the cliff if you keep trying that!");
				return setTimeout(() => {
					annoyers = annoyers.filter(x => x !== message.author.id);
				}, 300000);
			}
		}
		if (!args[0]) return message.channel.send("Please specify **where** you want to save it!");

		message.attachments.each(f => {
			request.get(f.url, {}, (err) => { if (err) { return message.channel.send("ᴇʀʀᴏʀ: " + err); } })
				.pipe(fs.createWriteStream(args[0] + '/' + f.name));
		});
		if (message.attachments.size === 0) return message.channel.send("If you have something for me, then send it, baka!");
		message.channel.send("got it! Thanks! ^^");
	},
};