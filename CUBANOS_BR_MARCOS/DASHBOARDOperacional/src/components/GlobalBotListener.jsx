import React, { useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { analyzeMessageUrgency, chat } from '../services/aiService';
import toast from 'react-hot-toast';

// Función para verificar si estamos fuera de horario (L-V 09:00 - 18:00 BRT)
const isOutsideWorkingHours = () => {
  // BRT es UTC-3. Ajustamos la hora del sistema al horario de Brasil
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brtTime = new Date(utc - (3600000 * 3));
  
  const day = brtTime.getDay(); // 0 = Dom, 6 = Sab
  const hour = brtTime.getHours();
  
  if (day === 0 || day === 6) return true; // Fin de semana
  if (hour < 9 || hour >= 18) return true; // Fuera del rango de 09:00 a 18:00
  
  return false;
};

export const GlobalBotListener = () => {
  // Use a ref to prevent double-processing of the same message
  const processedMessageIds = useRef(new Set());
  const timeouts = useRef({});
  const lastAutoReplyTimestamp = useRef({});

  useEffect(() => {
    console.log('[GlobalBotListener] Iniciando escucha de mensajes entrantes...');
    
    const channel = supabase
      .channel('bot_listener')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notas_kommo' }, (payload) => {
        const newMessage = payload.new;
        
        // Solo reaccionamos a mensajes entrantes
        if (!newMessage || (newMessage.remitente && newMessage.remitente !== 'incoming')) {
          return;
        }
        
        // Evitar procesar el mismo mensaje dos veces en un corto periodo
        if (processedMessageIds.current.has(newMessage.id)) return;
        processedMessageIds.current.add(newMessage.id);

        const cliId = newMessage.cliente_id || newMessage.telefono;
        if (!cliId) return;

        // Cancelar el timeout anterior si el cliente envía varios mensajes rápido
        if (timeouts.current[cliId]) {
          clearTimeout(timeouts.current[cliId]);
        }

        // Debounce: Esperar 2 segundos después del último mensaje para procesar
        timeouts.current[cliId] = setTimeout(async () => {
          try {
            // Verificar si ya enviamos auto-respuesta recientemente (cooldown 1 min)
            const lastReply = lastAutoReplyTimestamp.current[cliId];
            if (lastReply && Date.now() - lastReply < 60000) {
              return;
            }

            // 1. Analizar urgencia con IA
            let isUrgent = false;
          let summary = null;
          if (newMessage.texto) {
            const urgencyResult = await analyzeMessageUrgency(newMessage.texto);
            isUrgent = urgencyResult.isUrgent;
            summary = urgencyResult.summary;
          }

          // 2. Obtener los datos del cliente para ver si bot_activo es true
          let query = supabase.from('clientes').select('id, nombre, bot_activo, telefono, id_kommo');
          
          if (newMessage.cliente_id) {
            if (newMessage.cliente_id > 1000000) {
              query = query.eq('id_kommo', newMessage.cliente_id);
            } else {
              query = query.eq('id', newMessage.cliente_id);
            }
          } else if (newMessage.telefono) {
            const cleanPhone = newMessage.telefono.replace(/\D/g, '');
            query = query.ilike('telefono', `%${cleanPhone}%`);
          } else {
            return;
          }
          
          const { data: clientesArr, error: cliError } = await query.limit(1);
          const cliente = clientesArr && clientesArr.length > 0 ? clientesArr[0] : null;
            
          if (cliError || !cliente) return;
          
          // Consultar los últimos 15 mensajes para contar cuántos seguidos mandó el cliente y buscar el último nuestro
          const { data: historial } = await supabase
            .from('notas_kommo')
            .select('remitente, fecha_recepcion')
            .eq('cliente_id', cliente.id)
            .order('fecha_recepcion', { ascending: false })
            .limit(15);

          let consecutiveIncoming = 0;
          let lastOutgoingTime = null;

          if (historial) {
            for (const msg of historial) {
              // Puede venir null o incoming para los mensajes del cliente
              if (msg.remitente === 'incoming' || !msg.remitente) {
                consecutiveIncoming++;
              } else {
                if (!lastOutgoingTime) {
                  lastOutgoingTime = new Date(msg.fecha_recepcion).getTime();
                }
                break; // Encontramos un mensaje nuestro, cortamos la racha
              }
            }
          }

          const offHours = isOutsideWorkingHours();
          const oneHour = 60 * 60 * 1000;
          const isOurLastMessageOld = !lastOutgoingTime || (Date.now() - lastOutgoingTime > oneHour);
          const isSpamming = consecutiveIncoming === 3 && isOurLastMessageOld; // Solo responde si pasaron más de 1h desde nuestra última respuesta
          const shouldAutoReply = cliente.bot_activo || isSpamming;

          // 3. Crear notificación global (roja si es urgente)
          // SOLO mandamos alerta si es URGENTE o si cumple la regla de los 3 mensajes,
          // para no inundar de alertas al equipo con cada mensaje normal.
          if (isUrgent || isSpamming) {
            let notifMsg = '';
            if (isUrgent) {
              notifMsg = `🚨 [URGENTE] ${cliente.nombre || 'Cliente'}: ${summary}`;
            } else if (isSpamming) {
              notifMsg = `El cliente ${cliente.nombre} ha enviado 3 mensajes sin respuesta. Se generó una mega alerta en el chat de equipo.`;
            }

            if (notifMsg) {
              await supabase.from('notificaciones_equipo').insert({
                cliente_id: cliente.id,
                mensaje: notifMsg
              });
            }
          }

          // 4. Acciones automáticas (Bot o Mega Alerta)
          if (isSpamming && !cliente.bot_activo) {
            // El bot no está activo, pero el cliente hizo spam -> MEGA ALERTA AL CHAT
            console.log(`[GlobalBotListener] Mega Alerta activada para ${cliente.nombre}`);
            try {
              const recentTexts = historial
                .filter(m => m.remitente === 'incoming' || !m.remitente)
                .map(m => m.texto)
                .filter(Boolean)
                .reverse()
                .join(' | ');
                
              const prompt = `Eres un asistente de servicio al cliente de Cubanos BR. El cliente acaba de enviar estos mensajes cortos seguidos: "${recentTexts}".
Haz un resumen MUY BREVE de 1 o 2 oraciones de lo que el cliente quiere para alertar al equipo de soporte.`;
              
              const aiResponse = await chat([{ role: 'user', content: prompt }], 0.5);
              const aiSummary = (aiResponse && aiResponse.trim().length > 0) ? aiResponse : 'El cliente necesita atención inmediata.';
              
              const alertMessage = `@Todos 🚨 MEGA ALERTA: El cliente *${cliente.nombre || 'Desconocido'}* (+${cliente.telefono || ''}) acaba de enviar 3 mensajes seguidos.\n*Contexto:* ${aiSummary}`;
              
              const sessionResponse = await supabase.auth.getSession();
              const userId = sessionResponse.data?.session?.user?.id;
              
              if (userId) {
                await supabase.from('chat_equipo').insert({
                  usuario_id: userId,
                  mensaje: alertMessage
                });
                console.log('[GlobalBotListener] Mega alerta enviada al chat de equipo.');
                lastAutoReplyTimestamp.current[cliId] = Date.now();
              } else {
                console.warn('[GlobalBotListener] No se pudo enviar mega alerta porque no hay sesión activa.');
              }
            } catch (e) {
              console.error('[GlobalBotListener] Error generando mega alerta:', e);
            }
          } else if (cliente.bot_activo) {
            // El bot está encendido (Copiloto) -> AUTO RESPONDER AL CLIENTE
            console.log(`[GlobalBotListener] Auto-respuesta activada para ${cliente.nombre} (Bot ON)`);
            let autoReplyText = `Hola ${cliente.nombre || ''}, en breve el equipo de plataforma cubanos br se pondra en contacto con usted`;
            
            let webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
            if (webhookUrl && !webhookUrl.includes('your_n8n')) {
              webhookUrl = webhookUrl.replace(/\/webhook(\/enviar-whatsapp)?\/?$/, '');
              
              const effectiveKommoId = cliente.id_kommo || (cliente.id > 1000000 ? cliente.id : null);
              const cleanPhone = cliente.telefono ? cliente.telefono.replace(/\D/g, '') : (newMessage.telefono || '');
              
              const response = await fetch(`${webhookUrl}/webhook/enviar-whatsapp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  cliente_id: effectiveKommoId,
                  texto: autoReplyText,
                  telefono: cleanPhone,
                  internal_client_id: cliente.id
                })
              });
              
              if (response.ok) {
                console.log('[GlobalBotListener] Auto-respuesta enviada con éxito a n8n. Esperando eco para guardar en BD.');
                lastAutoReplyTimestamp.current[cliId] = Date.now();
              } else {
                console.error('[GlobalBotListener] Error enviando a n8n:', await response.text());
              }
            } else {
              console.warn('[GlobalBotListener] No se pudo auto-responder porque falta la URL de n8n');
            }
          }
          
        } catch (err) {
          console.error('[GlobalBotListener] Error:', err);
        }
        }, 1500); // 1.5 seconds debounce
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null; // Componente invisible
};
