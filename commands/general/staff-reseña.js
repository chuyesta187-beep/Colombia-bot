const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('staff-reseña')
    .setDescription('Deja una reseña del staff que te atendió')
    .addIntegerOption(option =>
      option.setName('estrellas')
        .setDescription('Calificación del 1 al 5')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(5)
    )
    .addStringOption(option =>
      option.setName('comentario')
        .setDescription('Tu opinión sobre la atención del staff')
        .setRequired(true)
    ),

  async execute(interaction) {

    const estrellas = interaction.options.getInteger('estrellas');
    const comentario = interaction.options.getString('comentario');

    const canalReseñas = interaction.guild.channels.cache.get('1522833540478406766');

    if (!canalReseñas) {
      return interaction.reply({
        content: '❌ Canal de reseñas no configurado',
        ephemeral: true
      });
    }

    // ⭐ emojis de estrellas
    const estrellasVisual = '⭐'.repeat(estrellas);

    const embed = new EmbedBuilder()
      .setTitle('⭐ NUEVA RESEÑA DEL STAFF')
      .setColor('Gold')
      .setDescription(`
🌴 **Community Colombia - Staff Review**

👤 Usuario: ${interaction.user}

⭐ Calificación: ${estrellasVisual} (${estrellas}/5)

📝 Comentario:
> ${comentario}

🎫 Ticket finalizado con feedback del usuario
      `)
      .setFooter({ text: 'Sistema de Reseñas • Community Colombia' })
      .setTimestamp();

    await canalReseñas.send({ embeds: [embed] });

    return interaction.reply({
      content: '✅ Gracias por tu reseña del staff',
      ephemeral: true
    });
  }
};
