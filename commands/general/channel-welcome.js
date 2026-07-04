const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');

// guardamos el canal en memoria (simple)
let welcomeChannelId = null;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channel-welcome')
    .setDescription('Configura el canal de bienvenida')
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal de bienvenida')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    const canal = interaction.options.getChannel('canal');

    welcomeChannelId = canal.id;

    interaction.client.welcomeChannelId = welcomeChannelId;

    await interaction.reply({
      content: `✅ Canal de bienvenida configurado en ${canal}`,
      ephemeral: true
    });
  }
};
