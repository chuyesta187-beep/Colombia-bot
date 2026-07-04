const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-affy-channel')
    .setDescription('Configura el canal de AFFY')
    .addChannelOption(opt =>
      opt.setName('canal')
        .setDescription('Canal de afiliaciones')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    const canal = interaction.options.getChannel('canal');

    interaction.client.affyChannelId = canal.id;

    await interaction.reply({
      content: `📢 Canal de AFFY configurado en ${canal}`,
      ephemeral: true
    });
  }
};
