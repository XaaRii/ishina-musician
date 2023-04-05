const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

module.exports = class extends Client {
  constructor(config) {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildIntegrations, // prolly not needed but hey
      ],
      allowedMentions: {
        parse: [ 'users', 'roles' ],
        repliedUser: true,
      },
    });

    this.commands = new Collection();

    this.config = config;
  }
};
