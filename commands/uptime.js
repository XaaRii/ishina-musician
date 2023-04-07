const ms = require("ms");
const { client } = require('../exports.js');

module.exports = {
	name: 'uptime',
	description: 'How long i\'m connected here?',
	showHelp: true,
	execute(message, args) {
		const uptime = client.uptime;
		return message.channel.send(`My uptime is ${ms(uptime, { long: true, decimal: 1 })}  (${uptime})\n*Not sure why you'd wanna know...*`);
	},
};