const express = require("express");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ChannelType,
  SlashCommandBuilder,
  REST,
  Routes,
  StringSelectMenuBuilder,
} = require("discord.js");

// ================= EXPRESS =================
const app = express();
app.get("/", (req, res) => res.send("Ticket bot online"));
app.listen(3000);

// ================= CONFIG (ENV) =================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID; 
const LOGS_CHANNEL_ID = process.env.LOGS_CHANNEL_ID;
const CATEGORY_ID = process.env.CATEGORY_ID;

// ================= CLIENT =================
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ================= SLASH COMMAND =================
const commands = [
  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Crea el panel de tickets"),
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("✅ Slash command registrado");
  } catch (err) {
    console.log(err);
  }
})();

// ================= READY =================
client.once("ready", () => {
  console.log(`🤖 Bot listo como ${client.user.tag}`);
});

// ================= LOGS =================
async function sendLog(guild, text) {
  const channel = guild.channels.cache.get(LOGS_CHANNEL_ID);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle("📜 Ticket Log")
    .setDescription(text)
    .setColor("Red")
    .setTimestamp();

  channel.send({ embeds: [embed] });
}

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {

  // ===== /panel =====
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "panel") {

      const embed = new EmbedBuilder()
        .setTitle("🎫 Sistema de Tickets")
        .setDescription(
          "Selecciona una opción para abrir un ticket:\n\n" +
          "📌 Soporte\n📌 Reportes\n📌 Compras\n📌 Bugs"
        )
        .setColor("Blue");

      const menu = new StringSelectMenuBuilder()
        .setCustomId("ticket_select")
        .setPlaceholder("📌 Selecciona una opción")
        .addOptions(
          { label: "Soporte", value: "soporte" },
          { label: "Reportes", value: "reportes" },
          { label: "Compras", value: "compras" },
          { label: "Bug", value: "bug" }
        );

      return interaction.reply({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(menu)],
      });
    }
  }

  // ===== SELECT MENU =====
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "ticket_select") {

      const member = interaction.member;
      const guild = interaction.guild;

      const existing = guild.channels.cache.find(
        c => c.name === `ticket-${member.id}`
      );

      if (existing) {
        return interaction.reply({
          content: "❌ Ya tienes un ticket abierto",
          ephemeral: true,
        });
      }

      const channel = await guild.channels.create({
        name: `ticket-${member.id}`,
        type: ChannelType.GuildText,
        parent: CATEGORY_ID,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: member.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
            ],
          },
          {
            id: STAFF_ROLE_ID,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
            ],
          },
        ],
      });

      const embed = new EmbedBuilder()
        .setTitle("🎫 Ticket Abierto")
        .setDescription("Un staff puede reclamar este ticket")
        .setColor("Green");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_claim")
          .setLabel("Reclamar")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("ticket_close")
          .setLabel("Cerrar")
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({
        content: `<@&${STAFF_ROLE_ID}> <@${member.id}>`,
        embeds: [embed],
        components: [row],
      });

      await sendLog(guild, `🎫 Ticket creado por <@${member.id}> en ${channel}`);

      return interaction.reply({
        content: `✅ Ticket creado: ${channel}`,
        ephemeral: true,
      });
    }
  }

  // ===== BOTONES =====
  if (!interaction.isButton()) return;

  const { guild, member, channel } = interaction;

  // ===== CLAIM =====
  if (interaction.customId === "ticket_claim") {

    if (!member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({
        content: "❌ Solo staff puede reclamar tickets",
        ephemeral: true,
      });
    }

    await interaction.reply(`👮 Ticket reclamado por ${member}`);

    await sendLog(guild, `👮 <@${member.id}> reclamó ${channel}`);
  }

  // ===== CLOSE =====
  if (interaction.customId === "ticket_close") {

    if (!member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({
        content: "❌ Solo staff puede cerrar tickets",
        ephemeral: true,
      });
    }

    await interaction.reply("🔴 Cerrando ticket...");

    await sendLog(guild, `🔴 Ticket cerrado en ${channel} por <@${member.id}>`);

    setTimeout(() => {
      channel.delete().catch(() => {});
    }, 2000);
  }
});

// ================= LOGIN =================
client.login(TOKEN);
