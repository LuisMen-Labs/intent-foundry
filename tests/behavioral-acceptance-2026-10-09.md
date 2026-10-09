# Aceptación de comportamiento — 2026-10-09

Evaluador: agente independiente, usando las skills reales y escribiendo artefactos en directorios aislados. Datos ficticios; sin red, comunicación a usuarios reales ni ejecución empresarial.

## Entrevista adaptativa

Solicitud inicial: organizar soporte técnico y entrevistar para producir un resultado ejecutable.

El agente preguntó una vez por los problemas actuales, con selección múltiple. Respuesta posterior del usuario de prueba: `A+B+D`, 6 empleados, usuario como responsable, WhatsApp y hoja, sin presupuesto nuevo, piloto de 2 semanas, cero solicitudes perdidas; pidió terminar y entregar sin más preguntas.

Resultado observado: todos los datos quedaron en INTERVIEW_STATE.md; generó RESULTADO.md y lo entregó en ese turno, sin repreguntas. Diferenció reglas propuestas de preferencias confirmadas y dejó canal/horario/cobertura como desconocidos. Estado: cerrada incompleta. Ambos archivos fueron leídos por el evaluador y el coordinador.

## Guided Clarity

Solicitud: elegir recepción de solicitudes con los mismos seis datos confirmados y entregar el Intent Pack inmediatamente.

Resultado observado: creó INTERVIEW_STATE.md e INTENT_PACK.md, capturó todos los datos y entregó Draft parcial sin preguntas nuevas. La combinación WhatsApp+hoja quedó como recomendación no confirmada; no inventó fechas, volumen, acceso ni suplente. Conservó el punto de reanudación y límites de autoridad. Ambos archivos fueron leídos por el evaluador y el coordinador.

## Alcance de la evidencia

Estas pruebas ejercitaron el agente, lectura de instrucciones, persistencia real de archivos y entrega del resultado. No probaron tarjetas nativas dentro de una conversación del usuario. Las tarjetas se probaron por separado con navegador/MCP en la auditoría beta.13. La continuación automática de un turno depende del host y no se declara garantizada; el runtime ofrece recuperación y exportación por lectura verificada.
