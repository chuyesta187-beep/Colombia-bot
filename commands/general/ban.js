const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Banea a un usuario del servidor')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a banear')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('razon')
        .setDescription('Razón del ban')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {

    const user = interaction.options.getUser('usuario');
    const reason = interaction.options.getString('razon') || 'Sin razón';

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      return interaction.reply({
        content: '❌ Usuario no encontrado en el servidor',
        ephemeral: true
      });
    }

    await member.ban({ reason });

    await interaction.reply({
      content: `🔨 ${user.tag} ha sido baneado\n📌 Razón: ${reason}`
    });
  }
};
