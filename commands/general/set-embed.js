const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-embed')
    .setDescription('Crea un embed personalizado en el canal')
    .addStringOption(option =>
      option.setName('titulo')
        .setDescription('Título del embed')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('descripcion')
        .setDescription('Descripción del embed')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Color en HEX (ej: #00ff00)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    const titulo = interaction.options.getString('titulo');
    const descripcion = interaction.options.getString('descripcion');
    const color = interaction.options.getString('color') || '#00A2E8';

    const embed = new EmbedBuilder()
      .setTitle(titulo)
      .setDescription(descripcion)
      .setColor(color)
      .setFooter({ text: '🌴 Community Colombia Bot' })
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed] });

    await interaction.reply({
      content: '✅ Embed enviado correctamente',
      ephemeral: true
    });
  }
};
