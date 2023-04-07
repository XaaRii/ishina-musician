const config = require('../.cfg.json');
module.exports = {
	name: 'pull',
	description: `Gets file. Owner only!`,
	aliases: ['getfile', 'getf'],
	usage: `<where? path>`,
	showHelp: false,
	async execute(message, args) {
		if (!config.admins.includes(message.author.id)) return message.reply("*You tried to pull some bitches, but...*\n  Don't you dare hunt in **my** territory! <:cocoGun:1037328931386298378>");
		if (!args[0]) return message.channel.send("Please specify a path of the file you want! (name included ofc)\nSomething like: `/home/pi/test.png` or `C:/Users/username/Desktop/file.png` or `./heya.png`");
		message.channel.send({ content: "Here you go.", files: [args[0]] }).catch(err => {
			message.channel.send('I can\'t find that file! sry');
		});
	},
};