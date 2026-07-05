const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-panel-ticket')
    .setDescription('Crea el panel de tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setTitle('🎫・CENTRO DE SOPORTE')
      .setColor('Blue')
      .setDescription(`
🛠️ Soporte General  
🚨 Reportar Usuario  
🛡️ Reportar Staff  
🤝 Alianzas / Afiliaciones  
⚖️ Apelar Sanción  
📁 Otros  

━━━━━━━━━━━━━━━━━━━━━━
Selecciona una opción para abrir un ticket.
      `);

    const row1 = new ActionRowBuilder().addComponents(
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
        .setCustomId('ticket_staff')
        .setLabel('Staff')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🛡️')
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_alliance')
        .setLabel('Alianzas')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🤝'),

      new ButtonBuilder()
        .setCustomId('ticket_apelar')
        .setLabel('Apelar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⚖️'),

      new ButtonBuilder()
        .setCustomId('ticket_otros')
        .setLabel('Otros')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📁')
    );

    await interaction.channel.send({
      embeds: [embed],
      components: [row1, row2]
    });

    await interaction.reply({
      content: '✅ Panel de tickets creado correctamente',
      ephemeral: true
    });
  }
};
