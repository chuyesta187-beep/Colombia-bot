// ==========================================================
// 🌐 SERVIDOR WEB (EXPRESS) - Mantiene el bot vivo 24/7
// ==========================================================
const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('══『🌴 COMMUNITY COLOMBIA』══<br>El bot está en línea y gestionando comunidades de manera profesional.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Servidor web iniciado con éxito en el puerto ${PORT}`);
});

// ==========================================================
// 🤖 CLIENTE DE DISCORD (DISCORD.JS v14 - Enums Modernos)
// ==========================================================
const { 
    Client, 
    GatewayIntentBits, 
    Collection, 
    REST, 
    Routes, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ChannelType,             // Reemplaza los tipos numéricos
    PermissionFlagsBits     // Reemplaza los permisos en texto plano
} = require('discord.js');

const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

// Colecciones globales para el bot
client.commands = new Collection();
const commandsArray = [];

// ==========================================================
// ⚙️ CONFIGURACIÓN GLOBAL DEL SISTEMA DE TICKETS
// ==========================================================
const TICKET_CATEGORY_ID = '1522856204345413692'; // 📂 Categoría de tickets
const STAFF_ROLE_ID = '1522834090506719302';      // 🛡️ Rol de Staff visible
const TICKET_LOGS_ID = '1522850070276608121';     // 📋 Canal de logs de tickets

// ==========================================================
// 📁 HANDLER DE COMANDOS (Carga dinámica desde /commands)
// ==========================================================
const foldersPath = path.join(__dirname, 'commands');
if (fs.existsSync(foldersPath)) {
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                commandsArray.push(command.data.toJSON());
            } else {
                console.log(`[ADVERTENCIA] El comando en ${filePath} requiere las propiedades "data" o "execute".`);
            }
        }
    }
}

// ==========================================================
// 📁 HANDLER DE EVENTOS (Carga dinámica desde /events)
// ==========================================================
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
}

// ==========================================================
// 🚀 INICIO DEL BOT Y REGISTRO DE SLASH COMMANDS (/)
// ==========================================================
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    console.log(`🌴 ¡Community Colombia Bot está encendido!`);
    console.log(`🤖 Conectado como: ${client.user.tag}`);
    
    try {
        console.log(`🔄 Actualizando ${commandsArray.length} comandos de barra de forma global...`);

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commandsArray },
        );

        console.log('✅ ¡Todos los comandos de barra han sido registrados globalmente!');
    } catch (error) {
        console.error('❌ Error crítico al registrar comandos:', error);
    }
});

// ==========================================================
// 🧠 CONTROLADOR DE INTERACCIONES (Comandos, Botones y Modals)
// ==========================================================
client.on('interactionCreate', async interaction => {
    
    // 1. Ejecución de Comandos de Barra (/)
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(error);
            const errorMsg = { content: '❌ Ocurrió un error interno al ejecutar este comando.', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMsg);
            } else {
                await interaction.reply(errorMsg);
            }
        }
    }
    
    // 2. Manejo del Sistema de Tickets (Botones)
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('ticket_')) {
            const categoria = interaction.customId.replace('ticket_', '').toUpperCase();
            const nombreCanalEsperado = `🎫-${categoria.toLowerCase()}-${interaction.user.username}`;
            
            // Responder al usuario de inmediato de forma efímera
            await interaction.reply({ content: `⏳ Procesando tu solicitud de soporte...`, ephemeral: true });

            // 🌟 MEJORA 1: Evitar tickets duplicados del mismo usuario en la misma categoría
            const ticketExistente = interaction.guild.channels.cache.find(
                c => c.parentId === TICKET_CATEGORY_ID && c.name === nombreCanalEsperado
            );

            if (ticketExistente) {
                return interaction.editReply({
                    content: `❌ Ya tienes un ticket abierto para esta categoría: ${ticketExistente}`,
                    ephemeral: true
                });
            }
            
            try {
                // 🌟 MEJORA 4 y 5: Creación de canal con ChannelType y PermissionFlagsBits modernos
                const canalTicket = await interaction.guild.channels.create({
                    name: nombreCanalEsperado,
                    parent: TICKET_CATEGORY_ID,
                    type: ChannelType.GuildText, 
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel], // Ocultar a @everyone
                        },
                        {
                            id: interaction.user.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel, 
                                PermissionFlagsBits.SendMessages, 
                                PermissionFlagsBits.ReadMessageHistory
                            ],
                        },
                        {
                            id: STAFF_ROLE_ID,
                            allow: [
                                PermissionFlagsBits.ViewChannel, 
                                PermissionFlagsBits.SendMessages, 
                                PermissionFlagsBits.ReadMessageHistory
                            ],
                        },
                    ],
                });

                // Embed de bienvenida dentro del Ticket
                const embedTicketCreado = new EmbedBuilder()
                    .setColor(0x00A2E8)
                    .setTitle('══『 🎫 NUEVO TICKET 』══')
                    .setDescription(`══════════════════════════\n\nHola ${interaction.user}, gracias por contactar con el soporte.\nCategoría seleccionada: **${categoria}**\n\nEl equipo de **Security Team / Staff** te atenderá en breve.\n\n══════════════════════════`)
                    .setFooter({ text: '🌴 Community Colombia Bot • Sistema de Soporte Profesional' })
                    .setTimestamp();

                const filaCierre = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('cerrar_ticket')
                        .setLabel('Cerrar Ticket')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔒')
                );

                // 🌟 MEJORA 2: Enviar Embed y mencionar al Staff en el contenido
                await canalTicket.send({ 
                    content: `<@&${STAFF_ROLE_ID}>`, 
                    embeds: [embedTicketCreado], 
                    components: [filaCierre] 
                });

                // 🌟 MEJORA 3: Enviar el formulario automático de preguntas
                await canalTicket.send(`📋 **Por favor responde las siguientes preguntas:**\n\n👤 ¿Cuál es tu usuario?\n📝 Explica detalladamente tu problema o consulta.\n📸 ¿Tienes pruebas o capturas de pantalla?\n🎯 ¿Qué necesitas que haga el equipo de Staff?`);

                // Notificar con éxito al usuario en su interacción privada
                await interaction.editReply({ content: `✅ ¡Tu ticket ha sido creado con éxito en ${canalTicket}!`, ephemeral: true });

                // Registro de Logs del Ticket
                const logsChannel = interaction.guild.channels.cache.get(TICKET_LOGS_ID);
                if (logsChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('══『 🎫 LOG: TICKET CREADO 』══')
                        .setColor(0x5865F2)
                        .setDescription(
                            `══════════════════════════\n\n` +
                            `👤 **Usuario:** ${interaction.user} (\`${interaction.user.id}\`)\n` +
                            `📂 **Categoría:** ${categoria}\n` +
                            `📍 **Canal Creado:** ${canalTicket}\n\n` +
                            `══════════════════════════`
                        )
                        .setTimestamp()
                        .setFooter({ text: '🌴 Sistema de Registros Internos' });

                    await logsChannel.send({ embeds: [logEmbed] });
                }

            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: '❌ No pude crear el canal del ticket. Revisa mis permisos de Administrador.', ephemeral: true });
            }
        }

        // Cierre definitivo de tickets
        if (interaction.customId === 'cerrar_ticket') {
            await interaction.reply({ content: '🔒 Este ticket se cerrará y borrará definitivamente en 5 segundos...' });
            
            try {
                const logsChannel = interaction.guild.channels.cache.get(TICKET_LOGS_ID);
                if (logsChannel) {
                    const logCierreEmbed = new EmbedBuilder()
                        .setTitle('══『 🔒 LOG: TICKET CERRADO 』══')
                        .setColor(0xED4245)
                        .setDescription(
                            `══════════════════════════\n\n` +
                            `🔒 **Canal Cerrado:** \`#${interaction.channel.name}\`\n` +
                            `👤 **Acción por:** ${interaction.user}\n\n` +
                            `══════════════════════════`
                        )
                        .setTimestamp()
                        .setFooter({ text: '🌴 Sistema de Registros Internos' });
                        
                    await logsChannel.send({ embeds: [logCierreEmbed] });
                }
            } catch (err) {
                console.log('Error al enviar log de cierre:', err);
            }

            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                } catch (err) {
                    console.log('El canal ya no existe o faltan permisos para borrarlo.', err);
                }
            }, 5000);
        }
    }

    // 3. Manejo de Formularios Enviados (Modals de Postulaciones)
    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('modal_postu_')) {
            const puesto = interaction.customId.replace('modal_postu_', '').toUpperCase();
            
            await interaction.reply({
                content: `✅ Tu postulación para el puesto de **${puesto}** ha sido enviada exitosamente al equipo de **Community Managers**. ¡Buena suerte!`,
                ephemeral: true
            });
        }
    }
});

// ==========================================================
// 🔌 CONEXIÓN DEL BOT A DISCORD
// ==========================================================
client.login(process.env.TOKEN);
