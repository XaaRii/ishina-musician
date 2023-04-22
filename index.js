splash();
require('console-stamp')(console);

const fs = require('fs');
const config = require('./.cfg.json');
const { Collection, Events, AttachmentBuilder, REST, Routes } = require('discord.js');
const Client = require('./client/Client');
const client = new Client();
var prefix = config.prefix, prefixAlias = config.prefixAlias;
if (config.standalone) {
	prefix = config.standalonePrefix;
	prefixAlias = undefined;
}

// Commands init
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

// Slash commands init
client.slashCollection = new Collection();
const slashCollectionFiles = fs.readdirSync('./slashcmds').filter(file => file.endsWith('.js'));
for (const file of slashCollectionFiles) {
	const command = require(`./slashcmds/${file}`);
	client.slashCollection.set(command.data.name, command);
}

const rest = new REST({ version: '10' }).setToken(config.dcToken);

const { exec } = require('child_process');
const { inspect } = require('util');

const { Player } = require('discord-player');
const player = new Player(client, { autoRegisterExtractor: false });
await player.extractors.loadDefault();

// player.events.on('connection', (queue) => {
// 	queue.connection.on('stateChange', (oldState, newState) => {
// 		const oldNetworking = Reflect.get(oldState, 'networking');
// 		const newNetworking = Reflect.get(newState, 'networking');

// 		const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
// 			const newUdp = Reflect.get(newNetworkState, 'udp');
// 			clearInterval(newUdp?.keepAliveInterval);
// 		}

// 		oldNetworking?.off('stateChange', networkStateChangeHandler);
// 		newNetworking?.on('stateChange', networkStateChangeHandler);
// 	});
// });

player.events.on('error', (queue, error) => {
	console.log(`[${queue.guild.name}] Error emitted from the queue: ${error}`);
});

player.events.on('playerError', (queue, error) => {
	console.log(`[${queue.guild.name}] playerError emitted from the connection: ${error.message}`);
});

player.events.on('playerStart', (queue, track) => {
	queue.metadata.channel.send(`▶ | Started playing: **${track.title}** in <#${queue.channel.id}>!`);
});

player.events.on('audioTrackAdd', (queue, track) => {
	queue.metadata.channel.send(`🎶 | Track **${track.title}** queued!`);
});

player.events.on('audioTracksAdd', (queue, track) => {
	queue.metadata.channel.send(`🎶 | **${track.length} song(s)** queued!`);
});

player.events.on('disconnect', queue => {
	queue.metadata.channel.send('❌ | Disconnecting...');
});

player.events.on('emptyChannel', queue => {
	// queue.metadata.channel.send('❌ | Nobody is in the voice channel, leaving...');
});

player.events.on('emptyQueue', queue => {
	const voiceConnection = queue.metadata.channel.guild.voice?.connection
	if (voiceConnection) queue.metadata.channel.send('✅ | Queue finished!');
});

player.events.on('error', (queue, error) => {
    console.log(`General player error event: ${error.message}`);
    console.log(error);
});

player.events.on('playerError', (queue, error) => {
    console.log(`Player error event: ${error.message}`);
    console.log(error);
});

client.on(Events.ClientReady, function () {
	console.info(`Logged in as ${client.user.tag}!`);
	if (config.standalone) {
		client.user.setPresence({
			activities: [{ name: config.standalonePresence.activity, type: Number(config.standalonePresence.type) }],
			status: config.standalonePresence.status,
		});
	} else {
		client.user.setStatus('invisible');
		console.info(`I am a module [${config.moduleName}] with prefix ${config.prefix} (${config.prefixAlias})`);
		if (client.channels.cache.get('894203532092264458') !== undefined) client.channels.cache.get('894203532092264458').send('Musician module started!');
	}
});

client.once(Events.ShardReconnecting, () => {
	console.log('Reconnecting!');
});

client.once(Events.ShardDisconnect, () => {
	console.log('Disconnect!');
});

client.on(Events.MessageCreate, async message => {
	if (!config.standalone && message.channel.id === "894204559306674177" && message.content === "Module check!") return message.channel.send({ content: config.moduleName });
	if (message.author.bot || !message.guild) return;

	var shorty = false;
	if (prefixAlias && message.content.toLowerCase().startsWith(prefixAlias)) shorty = true;
	else if (!message.content.toLowerCase().startsWith(prefix)) return;

	const args = shorty ? message.content.slice(prefixAlias.length).trim().split(/ +/) : message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	switch (commandName) {
		case "refresh":
			message.channel.sendTyping();
			var commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
			for (const file of commandFiles) {
				const command = require(`./commands/${file}`);
				client.commands.set(command.name, command);
			}
			commandFiles = fs.readdirSync('./slashcmds').filter(file => file.endsWith('.js'));
			for (const file of commandFiles) {
				const command = require(`./slashcmds/${file}`);
				client.slashCollection.set(command.data.name, command);
			}
			message.reply("Command list reloaded.");
			break;
		case "crash": case "fs":
			if (config.admins.includes(message.author.id)) {
				var whoasked = message.author.username;
				if (commandName === "fs") { // fs
					message.channel.send('Full Reset...')
						.then(msg => {
							client.destroy();
							console.log(`Shutting down on request of ${whoasked}.`);
							process.exit();
						});
				} else { // crash
					message.channel.send('Oh shit a concrete wall-')
						.then(msg => {
							client.destroy();
							console.log(`Concrete wall built on request of ${whoasked}.`);
							const x = require("./keepAlive.js");
						});
				}
			} else message.channel.send("*You wanted to restart their framework, but you don't have enough permissions.*\n  Hehe, error 404: Your perms not found.");
			break;
		case "rpicmd": case "eval":
			var cmd = args.join(' ').toString();
			message.channel.sendTyping();
			if (config.admins.includes(message.author.id)) {
				if (commandName === "rpicmd") return execcall(message.channel, cmd);
				else return evalcall(args, message);
			} else return message.reply("**ᴀᴄᴄᴇꜱꜱ ᴅᴇɴɪᴇᴅ**, get lost.");
		case "deploy":
			if (!config.admins.includes(message.author.id)) return message.channel.send("How about deploying yourself into a proper employment instead?");
			if (!["global", "local"].includes(args[0])) message.channel.send("Missing argument: local/global (overwrite)");
			message.channel.sendTyping();
			var resp = ['Registering commands in progress...\n'];
			var progressbar = args[1] !== "overwrite" ? await message.reply({ content: resp.join("") }) : undefined;
			if (args[0] === "local") {
				try {
					const slashCommands = [];
					client.slashCollection = new Collection();
					var i = 0;
					const slashFiles = fs.readdirSync('./slashcmds').filter(file => file.endsWith('.js'));
					for (const file of slashFiles) {
						const command = require(`./slashcmds/${file}`);
						client.slashCollection.set(command.data.name, command);
						if (args[1] === "overwrite") slashCommands.push(command.data);
						else {
							await rest.post(Routes.applicationCommands(config.dcAppID, message.guildId), { body: command.data.toJSON() });
							resp.push(command.data.name + " ");
							progressbar.edit(resp.join(""));
						}
						i++;
					}
					console.log(`deploy of ${i} slash commands globally on ${message.author.username}'s request.`);
					if (args[1] === "overwrite") await rest.put(Routes.applicationCommands(config.dcAppID, message.guildId), { body: slashCommands });
					if (!progressbar) message.reply(i + " slash commands deployed successfully on this server~");
					else {
						resp.push(`\n\n${i} slash commands deployed successfully on this server~`);
						progressbar.edit(resp.join(""));
					}
				} catch (error) {
					if (!progressbar) message.channel.send('Could not deploy commands!\n' + error);
					else progressbar.edit('Could not deploy commands!\n' + error);
					console.error(error);
				}
			} else if (args[0] === "global") {
				try {
					const slashPubCommands = [];
					client.slashCollection = new Collection();
					i = 0;
					const slashFiles = fs.readdirSync('./slashcmds').filter(file => file.endsWith('.js'));
					for (const file of slashFiles) {
						const command = require(`./slashcmds/${file}`);
						client.slashCollection.set(command.data.name, command);
						if (!command.developer) {
							args[1] === "overwrite" ? slashPubCommands.push(command) : await rest.post(Routes.applicationCommands(config.dcAppID), { body: command.data.toJSON() });
							i++;
						}
					}
					console.log(`deploy of ${i} slash commands globally on ${message.author.username}'s request.`);
					if (args[1] === "overwrite") await rest.put(Routes.applicationCommands(config.dcAppID), { body: slashPubCommands });
					message.reply(i + " slash commands deployed successfully~\nChanges may take a bit longer to proceed tho...");
				} catch (error) {
					message.reply("Could not deploy commands!\n" + error);
					console.error(error);
				}
			} else return message.channel.send("Missing argument: local/global (overwrite)");
			break;
	}
	var command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if (!command) return;

	if (command.guildOnly && message.channel.isDMBased()) {
		const guildOnlyMessages = ["I'm not gonna respond to this, unless you ask me on a server", "Y'know this one's a server command, right?", "I can't help you here, let's go on server!", "I can't execute that command inside DMs!"];
		const randomGuildOnlyMessage = guildOnlyMessages[Math.floor(Math.random() * guildOnlyMessages.length)];
		return message.reply(randomGuildOnlyMessage);
	}
	// try catch for commands
	try { command.execute(message, args); }
	catch (error) {
		console.error(error);
		return message.channel.send(`Error happened. Either you or my creator fucked up.\nᴇʀʀᴏʀ: \`${error}\``);
	}
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.slashCollection.get(interaction.commandName);
	if (!command) return; // Not meant for us
	if (command.developer && !config.admins.includes(interaction.author.id)) {
		return interaction.reply({
			content: "This command is only available to the developer (and you look like someone who can't even make 'Hello world' program).",
			ephemeral: true,
		});
	}
	try {
		command.execute(interaction, player);
	} catch (error) {
		console.error(error);
		interaction.followUp({
			content: 'There was an error trying to execute that command:\n' + error, ephemeral: true,
		});
	}
});

process.on('uncaughtException', (reason) => {
	console.log(reason);
	if (client.channels.cache.get('735207428299161602') !== undefined) client.channels.cache.get('735207428299161602').send(config.moduleName + ': `UncaughtException:`\n' + reason);
});
process.on('unhandledRejection', (reason) => {
	console.log(reason);
	if (client.channels.cache.get('735207428299161602') !== undefined) client.channels.cache.get('735207428299161602').send(config.moduleName + ': `Unhandled promise rejection:`\n' + reason);
});

client.login(config.dcToken);

/* FUNCTIONS */

async function splash() {
	return console.log(`
	▄▄▄    ▀█▓      █▌  ▄█▀▒▒▄▄▄   ███▄   ▀█  ██▓▒▀█     █▀▒ ▒ █████ ██▀███   
   ▒████▄  ▓▄█▒    ▓█▌▄█▀▒▓▒████▄   ██▓▀█  █▌▒▓██▒▒▒▀█▄█▀▒░▒ ██▒  ██▒▓██ ▒ ██▒
  ▒██  ▀█▄ ▒█▀░    ▓███▄░▒▒██  ▀█▄ ▓██▒▒▀█ █▌▒▒██▒░░░▄█▀░░░ ▒██░  ██▒▓██ ░▄█ ▒
 ░██▄▄▄▄██ ▒█▄░    ▓█▌ █▄░██▄▄▄▄██ ▓██▒▒▒▐▌█▌░ ██░░▄█▀▀█▄▒  ▒██   ██░▒██▀▀█▄  
  ▓█   ▓██▒░█████▄▒▓█▌▒ █▄▓█   ▓██▒▄██░ ▒▄██▒░ ██▒▄█ ▒ ▒█▄▒  ████▓▒░░ ██▓ ▒██▒
  ▒▒   ▓▒█░░ ▒░░ ▓░▒▒▒▒ ▓▒▒▒   ▓▒█░░░▒░ ░▒▒▒▒░░▓  ▒▒ ▒ ░▒░▓░ ▒░▒░▒░ ░▓▒░ ░▒▓░ 
   ▒   ▒▒ ░░ ░  ▒ ░░ ░▒ ▒░ ▒   ▒▒ ░░ ░   ░ ▒░ ░▒ ░░░ ░  ░▒▒░ ░ ▒ ▒░ ▒▒░  ░ ▒░ 
   ░   ▒     ░  ░  ░ ░░ ░  ░   ▒   ░░      ░   ▒ ░ ░      ░  ░ ░ ▒  ░░     ░  
	   ░  ░       ░░  ░        ░  ░        ░   ░   ░    ░      ░ ░   ░        

					      Ishina Modules: Musician
`);
}

async function execcall(msgchannel, cmd) {
	const m = await msgchannel.send("Request sent.");
	exec(cmd, function (error, stdout, stderr) {
		if (!stdout) {
			m.edit("Done.");
		} else if (stdout.length >= 1950) {
			const atc = new AttachmentBuilder(Buffer.from(stdout), { name: 'rpicmd.txt' });
			m.edit({ content: "Done! Here are the results:", files: [atc] });
		} else m.edit({ content: "Done! Here are the results:\n" + stdout });
		if (error !== null) {
			msgchannel.send("ᴇʀʀᴏʀ: `" + stderr + "`");
		}
	});
}

async function evalcall(args, message) {
	let evaled;
	try {
		if (args[0] === "output") {
			evaled = await eval(args.slice(1).join(' '));
			if (evaled !== undefined) {
				if (inspect(evaled).length >= 1970) {
					const atc = new AttachmentBuilder(Buffer.from(inspect(evaled)), { name: 'eval.txt' });
					message.channel.send({ content: "Evaluation too long, so instead i'll send a file containing result.:", files: [atc] });
				} else message.channel.send(inspect(evaled));
				console.log(inspect(evaled));
			} else return message.channel.send("Evaluated.");
		} else {
			evaled = await eval(args.join(' '));
		}
	}
	catch (err) {
		console.error(err);
		message.reply(`There was an error during evaluation. ᴇʀʀᴏʀ: \`${err}\``);
	}
}