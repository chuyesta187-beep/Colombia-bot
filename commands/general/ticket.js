const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Abre el panel de tickets'),

  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setTitle('🎫 Sistema de Tickets')
      .setDescription('Selecciona una opción para crear un ticket')
      .setColor('Blue');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_soporte')
        .setLabel('Soporte')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🛠️'),

      new ButtonBuilder()
        .setCustomId('ticket_reporte')
        .setLabel('Reporte')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🚨'),

      new ButtonBuilder()
        .setCustomId('ticket_otros')
        .setLabel('Otros')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📁')
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};
