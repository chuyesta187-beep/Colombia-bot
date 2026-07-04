const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-all')
    .setDescription('Configura automáticamente todo el sistema del servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    await interaction.deferReply({ flags: 64 });

    const guild = interaction.guild;

    // 📂 CATEGORÍA TICKETS
    const ticketCategory = await guild.channels.create({
      name: '🎫 TICKETS',
      type: 4 // Category
    });

    // 📋 CANAL LOGS
    const logsChannel = await guild.channels.create({
      name: '📋-logs',
      type: 0
    });

    // 🤝 ALLY
    const allyChannel = await guild.channels.create({
      name: '🤝-allys',
      type: 0
    });

    // 📢 AFFY
    const affyChannel = await guild.channels.create({
      name: '📢-affys',
      type: 0
    });

    // 🛠️ PANEL TICKETS
    const ticketPanel = await guild.channels.create({
      name: '🎫-soporte',
      type: 0
    });

    const embed = new EmbedBuilder()
      .setTitle('🚀 SETUP COMPLETADO')
      .setColor(0x00A2E8)
      .setDescription(`
✅ Sistema configurado correctamente:

📂 Tickets: ${ticketCategory}
📋 Logs: ${logsChannel}
🤝 Ally: ${allyChannel}
📢 Affy: ${affyChannel}
🎫 Panel: ${ticketPanel}

🔥 Ahora solo usa:
• /set-panel-ticket
• /set-ally-channel
• /set-affy-channel
      `)
      .setFooter({ text: '🌴 Community Colombia Bot' });

    await ticketPanel.send({
      content: '🎫 Aquí se enviará el panel de tickets'
    });

    await interaction.editReply({
      embeds: [embed]
    });
  }
};
