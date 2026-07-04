const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra todos los comandos del bot'),

  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setTitle('🇨🇴🌴 Community Colombia Bot - Help')
      .setColor('Green')
      .setDescription(`
⚙️ **Configuración**
/set panel-ticket
/set embed

🎫 **Tickets**
/ticket

🛡️ **Moderación**
/ban
/kick
/timeout
/warn

📊 **Utilidades**
/ping
/userinfo
/serverinfo
/avatar

✨ Sistema completo para tu comunidad
      `)
      .setFooter({ text: 'Community Colombia Bot' });

    await interaction.reply({ embeds: [embed] });
  }
};
