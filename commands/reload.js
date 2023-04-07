const config = require("../.cfg.json");

module.exports = {
	name: 'reload',
	description: 'Reloads a command',
	aliases: ['rl'],
	usage: '<command you want to reload>',
	showHelp: false,
	execute(message, args) {
		if (!config.admins.includes(message.author.id)) return message.reply("Funny. Now get lost before I reload *my shotgun*.");
		message.channel.sendTyping();
		if (!args.length) return message.reply("I don't know what command you wanna reload!");
		const commandName = args[0].toLowerCase();
		const command = message.client.commands.get(commandName) || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
		const commandSlash = message.client.slashCollection.get(args[0]);
		var work = 0;
		if (command) {
			delete require.cache[require.resolve(`./${command.name}.js`)];
			try {
				const newCommand = require(`./${command.name}.js`);
				message.client.commands.set(newCommand.name, newCommand);
				work += 1;
			} catch (error) {
				console.log(error);
				message.channel.send(`I've got an error while reloading that command:\n\`${error.message}\``);
			}
		}
		if (commandSlash) {
			try {
				var newCommand = require("../slashcmds/" + commandSlash.data.name + ".js");
				message.client.slashCollection.set(newCommand.data.name, newCommand);
				work += 1;
			} catch (error) {
				console.log(error);
				message.channel.send("I've got an error while reloading that command:\n" + error.message);
			}
		}
		if (work < 1) return message.channel.send(`That's not a command I would know, ${message.author}!`);
		return message.channel.send(`Command \`${commandName}\` reloaded successfully`);
	},
};