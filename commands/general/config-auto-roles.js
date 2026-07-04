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
    .setName('config-auto-roles')
    .setDescription('Abre el panel de auto roles')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setTitle('🎭 PANEL DE AUTOROLES')
      .setColor('Purple')
      .setDescription(`
Selecciona un rol para asignarte automáticamente 👇

🎮 Jugador
🌴 Miembro
🔥 VIP
💬 Chat Active
      `);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('role_jugador')
        .setLabel('🎮 Jugador')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('role_miembro')
        .setLabel('🌴 Miembro')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('role_vip')
        .setLabel('🔥 VIP')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.channel.send({
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content: '✅ Panel de auto roles creado',
      ephemeral: true
    });
  }
};
