const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    Collection, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const express = require('express');
require('dotenv').config();

// ==========================================
// 1. SERVIDOR EXPRESS (Para Render 24/7)
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send({ status: "online", bot: "Nerox Guard", version: "6.5.0" });
});

app.listen(PORT, () => {
    console.log(`[SERVER] Servidor Express corriendo en el puerto ${PORT}`);
});

// ==========================================
// 2. CONFIGURACIÓN DEL CLIENTE DISCORD
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User]
});

// ID del rol de Staff permitido para gestionar los tickets
const STAFF_ROLE_ID = "1523178739653939240";
// ID del canal donde llegarán los logs de los tickets
const LOGS_CHANNEL_ID = "TU_ID_DE_CANAL_DE_LOGS"; 

// ==========================================
// 3. EVENTO: BOT LISTO Y REGISTRO DE COMANDOS
// ==========================================
client.once('ready', async () => {
    console.log(`[BOT] Conectado exitosamente como ${client.user.tag}`);
    
    // Registrar el comando /panel de forma global
    const data = [
        {
            name: 'panel',
            description: 'Despliega el panel premium de soporte técnico.',
        }
    ];

    try {
        await client.application.commands.set(data);
        console.log('[BOT] Comando global /panel registrado correctamente.');
    } catch (error) {
        console.error('[ERROR] Error al registrar comandos:', error);
    }
});

// ==========================================
// 4. MANEJO DE INTERACCIONES (Comandos y Botones)
// ==========================================
client.on('interactionCreate', async (interaction) => {
    
    // --- MANEJO DEL COMANDO /PANEL ---
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'panel') {
            // Verificar si el usuario es administrador para ejecutar el comando del panel
            if (!interaction.member.permissions.has('Administrator')) {
                return interaction.reply({ 
                    content: '❌ No tienes permisos de Administrador para usar este comando.', 
                    ephemeral: true 
                });
            }

            const embedPanel = new EmbedBuilder()
                .setTitle('══『🌴 NEROX GUARD SUPPORT』══')
                .setDescription(
                    'Bienvenido al centro de soporte técnico.\n\n' +
                    'Si necesitas asistencia, reportar un problema o realizar una consulta, ' +
                    'selecciona el botón de abajo para abrir un ticket de atención privada.\n\n' +
                    '**📌 Nota:** El mal uso de este sistema conllevó a una sanción.'
                )
                .setColor('#0b0b0b') // Estética Premium AMOLED/Black
                .setImage('https://i.imgur.com/EjemplodeBannerPremium.png') // Opcional: Banner decorativo
                .setFooter({ text: 'Nerox Guard • Sistema de Seguridad y Soporte', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('open_ticket')
                    .setLabel('Abrir Ticket')
                    .setEmoji('📩')
                    .setStyle(ButtonStyle.Secondary) // Estilo gris oscuro/premium
            );

            await interaction.reply({ content: '✅ Panel enviado correctamente.', ephemeral: true });
            return interaction.channel.send({ embeds: [embedPanel], components: [row] });
        }
    }

    // --- MANEJO DE BOTONES (Tickets, Reclamar, Cerrar) ---
    if (interaction.isButton()) {
        const { customId, member, guild, channel } = interaction;

        // 1. Creación del Ticket
        if (customId === 'open_ticket') {
            await interaction.deferReply({ ephemeral: true });

            // Evitar que abran múltiples tickets si ya existe uno (Opcional, basado en el nombre del canal)
            const channelName = `ticket-${member.user.username.toLowerCase()}`.replace(/[^a-z0-9-]/g, '');
            const existingChannel = guild.channels.cache.find(c => c.name === channelName);

            if (existingChannel) {
                return interaction.editReply({ content: `❌ Ya tienes un ticket abierto en ${existingChannel}.` });
            }

            // Crear el canal de ticket de forma privada
            const ticketChannel = await guild.channels.create({
                name: channelName,
                type: 0, // GuildText
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: ['ViewChannel'], // Oculto para todos
                    },
                    {
                        id: member.id,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles'], // Permisos al creador
                    },
                    {
                        id: STAFF_ROLE_ID,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles'], // Permisos al Staff
                    }
                ],
            });

            const embedTicket = new EmbedBuilder()
                .setTitle('══『 Ticket Creado 』══')
                .setDescription(
                    `Hola ${member},\n\n` +
                    'Gracias por contactar con el soporte. El equipo de soporte se pondrá en contacto contigo lo antes posible.\n\n' +
                    'Por favor, ve detallando tu consulta, reporte o duda junto con las capturas/IDs necesarias para agilizar el proceso.'
                )
                .setColor('#0b0b0b')
                .addFields(
                    { name: '👤 Usuario:', value: `${member.user.tag} (\`${member.id}\`)`, inline: true },
                    { name: '🔒 Estado:', value: '⏳ Esperando asignación de Staff', inline: true }
                )
                .setFooter({ text: 'Nerox Guard • Gestión Segura' })
                .setTimestamp();

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('claim_ticket')
                    .setLabel('Reclamar')
                    .setEmoji('👤')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Cerrar')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({ content: `${member} | <@&${STAFF_ROLE_ID}>`, embeds: [embedTicket], components: [actionRow] });
            return interaction.editReply({ content: `✅ Tu ticket ha sido creado con éxito en ${ticketChannel}` });
        }

        // 2. Reclamar Ticket
        if (customId === 'claim_ticket') {
            // Validación estricta de Staff
            if (!member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ No tienes permisos para reclamar este ticket.', ephemeral: true });
            }

            await interaction.deferUpdate();

            // Editar el embed original para reflejar el reclamo
            const originalEmbed = interaction.message.embeds[0];
            const updatedEmbed = EmbedBuilder.from(originalEmbed)
                .setColor('#2f3136')
                .spliceFields(1, 1, { name: '🔒 Estado:', value: `👤 Reclamado por ${member.user}`, inline: true });

            // Deshabilitar el botón de reclamar, mantener el de cerrar
            const updatedRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('claim_ticket').setLabel('Reclamado').setEmoji('✅').setStyle(ButtonStyle.Success).setDisabled(true),
                new ButtonBuilder().setCustomId('close_ticket').setLabel('Cerrar').setEmoji('🔒').setStyle(ButtonStyle.Danger)
            );

            await interaction.message.edit({ embeds: [updatedEmbed], components: [updatedRow] });
            return channel.send({ content: `📌 El ticket ha sido tomado por el agente de soporte ${member.user}.` });
        }

        // 3. Cerrar Ticket (Con sistema de Logs)
        if (customId === 'close_ticket') {
            // Validación estricta de Staff
            if (!member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ No tienes permisos para cerrar este ticket.', ephemeral: true });
            }

            await interaction.reply({ content: '🔒 Cerrando el ticket de manera permanente en 5 segundos...' });

            // Sistema de Logs antes de borrar el canal
            setTimeout(async () => {
                const logChannel = guild.channels.cache.get(LOGS_CHANNEL_ID);
                
                if (logChannel) {
                    const embedLog = new EmbedBuilder()
                        .setTitle('══『 Log: Ticket Cerrado 』══')
                        .setColor('#ff4747')
                        .addFields(
                            { name: '📝 Canal:', value: `\`${channel.name}\``, inline: true },
                            { name: '👤 Cerrado por:', value: `${member.user.tag} (\`${member.id}\`)`, inline: true }
                        )
                        .setTimestamp();
                    
                    try { logChannel.send({ embeds: [embedLog] }); } catch (e) { console.error(e); }
                }

                await channel.delete().catch(err => console.error("Error al borrar el canal:", err));
            }, 5000);
        }
    }
});

// ==========================================
// 5. LOGIN DEL BOT
// ==========================================
client.login(process.env.TOKEN);
