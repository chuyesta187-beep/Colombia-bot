const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra los comandos del bot'),

  async execute(interaction) {
    await interaction.reply(
      '🌴 Community Colombia Bot\n📌 /ping - Ver la latencia\n📌 /help - Ver esta ayuda'
    );
  },
};
