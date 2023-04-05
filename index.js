splash();
require('console-stamp')(console);

const fs = require('fs');
const { Collection, PresenceUpdateStatus } = require('discord.js');
const Client = require('./client/Client');
const config = require('./.cfg.json');
const { Player } = require('discord-player');

const { ActivityType } = require('discord.js');

const client = new Client();
client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

console.log(client.commands);

const player = new Player(client);

player.on('connectionCreate', (queue) => {
	queue.connection.voiceConnection.on('stateChange', (oldState, newState) => {
		const oldNetworking = Reflect.get(oldState, 'networking');
		const newNetworking = Reflect.get(newState, 'networking');

		const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
			const newUdp = Reflect.get(newNetworkState, 'udp');
			clearInterval(newUdp?.keepAliveInterval);
		}

		oldNetworking?.off('stateChange', networkStateChangeHandler);
		newNetworking?.on('stateChange', networkStateChangeHandler);
	});
});

player.on('error', (queue, error) => {
	console.log(`[${queue.guild.name}] Error emitted from the queue: ${error.message}`);
});

player.on('connectionError', (queue, error) => {
	console.log(`[${queue.guild.name}] Error emitted from the connection: ${error.message}`);
});

player.on('trackStart', (queue, track) => {
	queue.metadata.channel.send(`▶ | Started playing: **${track.title}** in **${queue.connection.channel.name}**!`);
});

player.on('trackAdd', (queue, track) => {
	queue.metadata.channel.send(`🎶 | Track **${track.title}** queued!`);
});

player.on('botDisconnect', queue => {
	queue.metadata.channel.send('❌ | I was manually disconnected from the voice channel, clearing queue!');
});

player.on('channelEmpty', queue => {
	queue.metadata.channel.send('❌ | Nobody is in the voice channel, leaving...');
});

player.on('queueEnd', queue => {
	queue.metadata.channel.send('✅ | Queue finished!');
});

client.once('ready', async () => {
	console.log('Ready!');
});

client.on('ready', function () {
	client.user.setPresence({
		activities: [{ name: config.activity, type: Number(config.activityType) }],
		status: PresenceUpdateStatus.Online,
	});
});

client.once('reconnecting', () => {
	console.log('Reconnecting!');
});

client.once('disconnect', () => {
	console.log('Disconnect!');
});

client.on('messageCreate', async message => {
	if (message.author.bot || !message.guild) return;
	if (!client.application?.owner) await client.application?.fetch();

	if (message.content === '!deploy' && message.author.id === client.application?.owner?.id) {
		await message.guild.commands
			.set(client.commands)
			.then(() => {
				message.reply('Deployed!');
			})
			.catch(err => {
				message.reply('Could not deploy commands! Make sure the bot has the application.commands permission!');
				console.error(err);
			});
	}
});

client.on('interactionCreate', async interaction => {
	const command = client.commands.get(interaction.commandName.toLowerCase());

	try {
		if (interaction.commandName == 'ban' || interaction.commandName == 'userinfo') {
			command.execute(interaction, client);
		} else {
			command.execute(interaction, player);
		}
	} catch (error) {
		console.error(error);
		interaction.followUp({
			content: 'There was an error trying to execute that command!',
		});
	}
});

client.login(config.dcToken);

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