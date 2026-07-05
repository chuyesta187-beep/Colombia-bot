const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    PermissionFlagsBits,
    ActivityType,
    PresenceUpdateStatus,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
const express = require('express');

// ==========================================
// 1. SERVIDOR EXPRESS (Para Render 24/7)
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send({ status: "online", bot: "Nerox Guard", version: "6.5.0" });
});

app.listen(PORT, () => console.log(`[SERVER] Servidor Express activo en puerto ${PORT}`));

// ==========================================
// 2. CONFIGURACIÓN DEL CLIENTE DISCORD
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages 
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User]
});

// VARIABLES DE CONFIGURACIÓN FIJAS
const STAFF_ROLE_ID = "1522834090506719302";      
const LOGS_CHANNEL_ID = "1522850070276608121";    
const CATEGORY_ID = "1522856204345413692";        
const REVIEWS_CHANNEL_ID = "1522833540478406766";  

// 🧠 CACHE TEMPORAL EN MEMORIA (Evita superar los 100 caracteres del customId)
const ticketCache = new Map();

// ==========================================
// 3. EVENTO: BOT READY Y PRESENCIA
// ==========================================
client.once('ready', async () => {
    console.log(`[BOT] Conectado exitosamente como ${client.user.tag}`);
    client.user.setPresence({
        status: PresenceUpdateStatus.DoNotDisturb,
        activities: [{ name: "🎫 Tickets | /panel", type: ActivityType.Watching }]
    });

    const commandsData = [{ name: 'panel', description: 'Despliega el panel premium de soporte técnico.' }];
    try {
        await client.application.commands.set(commandsData);
    } catch (error) {
        console.error('[ERROR] Fallo al registrar comandos:', error);
    }
});

// ==========================================
// 4. CONTROLADOR DE INTERACCIONES
// ==========================================
client.on('interactionCreate', async (interaction) => {
    
    // --- 4.1. COMANDO SLASH /PANEL ---
    if (interaction.isChatInputCommand() && interaction.commandName === 'panel') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ No tienes permisos de Administrador.', ephemeral: true });
        }

        const embedPanel = new EmbedBuilder()
            .setTitle('══『🌴 NEROX GUARD SUPPORT』══')
            .setDescription(
                'Bienvenido al centro de soporte técnico.\n\n' +
                'Si necesitas asistencia, reportar un problema o realizar una consulta, ' +
                'selecciona el botón de abajo para abrir un ticket de atención privada.\n\n' +
                '**📌 Nota:** El mal uso de este sistema conllevará sanciones.'
            )
            .setColor('#0b0b0b')
            .setFooter({ text: 'Nerox Guard • Sistema de Seguridad y Soporte', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('open_ticket').setLabel('Abrir Ticket').setEmoji('📩').setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ content: '✅ Panel enviado correctamente.', ephemeral: true });
        return interaction.channel.send({ embeds: [embedPanel], components: [row] });
    }

    // --- 4.2. MANEJO DE BOTONES ---
    if (interaction.isButton()) {
        const { customId, member, guild, channel } = interaction;

        // BOTÓN: ABRIR TICKET
        if (customId === 'open_ticket') {
            await interaction.deferReply({ ephemeral: true });

            const channelName = `ticket-${member.id}`;
            const existingChannel = guild.channels.cache.find(c => c.name === channelName);

            if (existingChannel) {
                return interaction.editReply({ content: `❌ Ya tienes un ticket abierto en ${existingChannel}.` });
            }

            const ticketChannel = await guild.channels.create({
                name: channelName,
                type: 0, 
                parent: CATEGORY_ID, 
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
                    { id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] }
                ],
            });

            // Guardamos los metadatos iniciales del ticket mapeados al ID del canal para rastrear el Staff después
            ticketCache.set(ticketChannel.id, { userId: member.id, staffId: null });

            const embedTicket = new EmbedBuilder()
                .setTitle('══『 Ticket Creado 』══')
                .setDescription(`Hola ${member},\n\nGracias por contactar con soporte. El equipo se pondrá en contacto contigo lo antes posible.\n\nPor favor, ve detallando tu consulta o reporte.`)
                .setColor('#0b0b0b')
                .addFields(
                    { name: '👤 Usuario:', value: `${member.user.tag} (\`${member.id}\`)`, inline: true },
                    { name: '🔒 Estado:', value: '⏳ Esperando asignación de Staff', inline: true }
                )
                .setFooter({ text: 'Nerox Guard • Gestión Segura' })
                .setTimestamp();

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('claim_ticket').setLabel('Reclamar').setEmoji('👤').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('close_ticket').setLabel('Cerrar').setEmoji('🔒').setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({ content: `${member} | <@&${STAFF_ROLE_ID}>`, embeds: [embedTicket], components: [actionRow] });
            return interaction.editReply({ content: `✅ Tu ticket ha sido creado con éxito en ${ticketChannel}` });
        }

        // BOTÓN: RECLAMAR TICKET
        if (customId === 'claim_ticket') {
            if (!member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ No tienes permisos para reclamar este ticket.', ephemeral: true });
            }

            await interaction.deferUpdate();

            // Actualizamos la caché en memoria agregando qué staff reclamó este canal específico
            const currentData = ticketCache.get(channel.id) || { userId: channel.name.split('-')[1], staffId: null };
            currentData.staffId = member.id;
            ticketCache.set(channel.id, currentData);

            const originalEmbed = interaction.message.embeds[0];
            const updatedEmbed = EmbedBuilder.from(originalEmbed)
                .setColor('#1a1a1a')
                .spliceFields(1, 1, { name: '🔒 Estado:', value: `👤 Reclamado por ${member.user}`, inline: true });

            const updatedRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('claimed_disabled').setLabel('Reclamado').setEmoji('✅').setStyle(ButtonStyle.Success).setDisabled(true),
                new ButtonBuilder().setCustomId('close_ticket').setLabel('Cerrar').setEmoji('🔒').setStyle(ButtonStyle.Danger)
            );

            await interaction.message.edit({ embeds: [updatedEmbed], components: [updatedRow] });
            return channel.send({ content: `📌 El ticket ha sido tomado por el agente de soporte ${member.user}.` });
        }

        // BOTÓN: CERRAR TICKET
        if (customId === 'close_ticket') {
            if (!member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ No tienes permisos para cerrar este ticket.', ephemeral: true });
            }

            await interaction.reply({ content: '🔒 Bloqueando ticket, enviando solicitud de reseña y eliminando canal...' });

            // Extraemos de forma segura los datos guardados en el Map usando el ID del canal
            const channelData = ticketCache.get(channel.id) || { userId: channel.name.split('-')[1], staffId: null };
            const { userId, staffId } = channelData;

            // Guardamos en memoria indexado por el ID del usuario para cuando responda en sus DMs
            ticketCache.set(`review_${userId}`, { staffId: staffId || "none" });

            try {
                const targetUser = await client.users.fetch(userId);
                if (targetUser) {
                    const embedDM = new EmbedBuilder()
                        .setTitle('⭐ Tu ticket ha sido resuelto')
                        .setDescription(
                            staffId 
                            ? `El miembro del staff <@${staffId}> ha finalizado tu atención.\n\nSi lo deseas, deja una reseña pulsando el botón de abajo.`
                            : `Tu ticket ha sido finalizado por el equipo de soporte.\n\nSi lo deseas, deja una reseña pulsando el botón de abajo.`
                        )
                        .setColor('#0b0b0b')
                        .setTimestamp();

                    // El customId se mantiene totalmente limpio y corto
                    const dmRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('trigger_review')
                            .setLabel('Dejar reseña')
                            .setEmoji('⭐')
                            .setStyle(ButtonStyle.Secondary)
                    );

                    await targetUser.send({ embeds: [embedDM], components: [dmRow] });
                }
            } catch (dmError) {
                console.log(`[DM INFO] El usuario ${userId} tiene los DMs bloqueados.`);
            }

            // Registrar cierre en logs del servidor
            const logChannel = guild.channels.cache.get(LOGS_CHANNEL_ID);
            if (logChannel && logChannel.isTextBased()) {
                const embedLog = new EmbedBuilder()
                    .setTitle('══『 Log: Ticket Cerrado 』══')
                    .setColor('#ff4747')
                    .addFields(
                        { name: '📝 Canal:', value: `\`${channel.name}\``, inline: true },
                        { name: '👤 Cerrado por:', value: `${member.user.tag}`, inline: true },
                        { name: '👮 Staff Asignado:', value: staffId ? `<@${staffId}>` : '*Ninguno*', inline: true }
                    )
                    .setTimestamp();
                await logChannel.send({ embeds: [embedLog] }).catch(() => {});
            }

            // Limpieza del canal de la caché e infraestructura
            ticketCache.delete(channel.id);
            setTimeout(async () => {
                await channel.delete().catch(err => console.error("Error al borrar canal:", err));
            }, 3000);
            return;
        }

        // BOTÓN EN EL DM: DISPARAR EL MODAL
        if (customId === 'trigger_review') {
            const modal = new ModalBuilder()
                .setCustomId('submit_review')
                .setTitle('Reseña de Soporte Técnico');

            const ratingInput = new TextInputBuilder()
                .setCustomId('rating_field')
                .setLabel('Calificación (Elige un número del 1 al 5)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ejemplo: 5')
                .setMinLength(1)
                .setMaxLength(1)
                .setRequired(true);

            const commentInput = new TextInputBuilder()
                .setCustomId('comment_field')
                .setLabel('Cuéntanos tu experiencia')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Escribe tus comentarios aquí...')
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(ratingInput),
                new ActionRowBuilder().addComponents(commentInput)
            );

            return interaction.showModal(modal);
        }
    }

    // --- 4.3. SUBMIT DEL MODAL DESDE EL DM ---
    if (interaction.isModalSubmit() && interaction.customId === 'submit_review') {
        await interaction.deferReply({ ephemeral: true });

        const userId = interaction.user.id;
        // Buscamos los datos del staff asociados al ID del usuario que interactúa desde sus DMs
        const cachedReviewData = ticketCache.get(`review_${userId}`) || { staffId: "none" };
        const { staffId } = cachedReviewData;

        const rawRating = interaction.fields.getTextInputValue('rating_field');
        const comment = interaction.fields.getTextInputValue('comment_field');

        let ratingNum = parseInt(rawRating) || 5;
        if (ratingNum < 1) ratingNum = 1;
        if (ratingNum > 5) ratingNum = 5;

        const stars = '★'.repeat(ratingNum) + '☆'.repeat(5 - ratingNum);

        try {
            const reviewsChannel = await client.channels.fetch(REVIEWS_CHANNEL_ID);
            if (reviewsChannel && reviewsChannel.isTextBased()) {
                const embedReview = new EmbedBuilder()
                    .setTitle('⭐ Nueva reseña de soporte')
                    .setColor('#0b0b0b')
                    .addFields(
                        { name: '👤 Usuario:', value: `<@${userId}>`, inline: true },
                        { name: '👮 Staff:', value: staffId !== "none" ? `<@${staffId}>` : '*No asignado*', inline: true },
                        { name: '⭐ Calificación:', value: `${stars} (${ratingNum}/5)`, inline: false },
                        { name: '📝 Comentario:', value: `\`\`\`text\n${comment}\n\`\`\``, inline: false },
                        { name: '🕒 Fecha:', value: '05/07/2026', inline: true }
                    )
                    .setTimestamp();

                await reviewsChannel.send({ embeds: [embedReview] });
                
                if (interaction.message) {
                    await interaction.message.edit({ components: [] }).catch(() => {});
                }

                // Borramos de memoria la reseña procesada para mantener la RAM limpia
                ticketCache.delete(`review_${userId}`);

                return interaction.editReply({ content: '✅ ¡Muchas gracias! Tu reseña ha sido enviada con éxito al servidor.' });
            }
        } catch (error) {
            console.error("[REVIEWS ERROR]", error);
            return interaction.editReply({ content: '❌ Hubo un error al procesar y enviar la reseña al servidor.' });
        }
    }
});

// ==========================================
// 5. LOGIN DEL CLIENTE
// ==========================================
client.login(process.env.TOKEN);
