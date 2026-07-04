const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-ally-channel')
    .setDescription('Configura el canal de ALLY')
    .addChannelOption(opt =>
      opt.setName('canal')
        .setDescription('Canal de alianzas')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    const canal = interaction.options.getChannel('canal');

    interaction.client.allyChannelId = canal.id;

    await interaction.reply({
      content: `🤝 Canal de ALLY configurado en ${canal}`,
      ephemeral: true
    });
  }
};
