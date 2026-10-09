# Auditoría adversa — 2026-10-09

Alcance: Guided Clarity, transporte MCP y recepción/entrega de respuestas. Solicitud: corregir atascos y actualizar GitHub. La autorización directa del usuario excluye la coordinación con Claude, que aclaró aplica al VPS.

## Hallazgos y correcciones

- P1: `submit_guided_answer` validaba y devolvía preguntas individuales sin persistencia recuperable. Ahora se guarda la pregunta original y su respuesta; se recuperan incluso tras reiniciar el servidor o recargar la tarjeta. Las definiciones alteradas y sesiones finalizadas no sobrescriben respuestas.
- P1: una promesa de transporte que no terminaba dejaba `sending` activo indefinidamente. Envío y recuperación tienen espera máxima de 15 segundos cada uno. La lectura inicial y checkpoints también tienen límite; un timeout no prueba que el guardado haya fallado.
- P2: completar una tarjeta no garantiza iniciar un turno del modelo. Se incorpora exportación por lectura verificada, con preguntas y respuestas originales. La skill consume respuestas al siguiente turno y entrega el pack sin exigir otra confirmación.
- P2: snapshot de sesión y respuesta individual tenían contratos de interpretación ambiguos. Se documenta validación de sesión, duplicados, cada respuesta, preguntas originales, revisiones y datos faltantes.
- P2: las etiquetas recibidas no son fuente autoritativa. El servidor reconstruye las etiquetas desde las opciones originales.
- P2: alcance, persistencia y autoridad confundían contexto con permisos o decisiones del usuario con hechos externos. Se delimita cuándo entrevistar, dónde guardar y cómo entregar un pack parcial.
- P2: combinación recomendada incompatible con el máximo de una bandera nativa. Se representa la combinación completa mediante explicación visible, respetando el esquema.

Una sospecha inicial sobre pérdida de revisiones al finalizar no se confirmó: `updateDraft` ya retira el ID de respuestas guardadas. No se presenta como defecto corregido.

## Verificación

- Validador oficial de skills: frontmatter válido; no demuestra comportamiento.
- TypeScript y 47 pruebas unitarias/contrato: pasan.
- MCP smoke: incluye persistencia individual, etiquetas canónicas, rechazo de definición alterada y recuperación entre procesos.
- Navegador aislado: selección múltiple, acuse perdido, remontaje, navegación, finalización, exportación y recuperación de pregunta individual.
- Agente independiente: simulaciones de instrucciones, no una entrevista real. Sus hallazgos de snapshot, combinaciones y cierre se incorporaron.

Se usó un directorio temporal aislado dentro del workspace porque el sandbox denegaba `rename` en su Temp. No se alteró el almacenamiento de producción para evadir ese fallo.

## Dependencias y límites

SDK MCP actualizado de 1.29.0 a 1.32.1 y cuatro dependencias transitivas mediante actualización compatible. npm audit bajó de 8 avisos (incluido uno crítico) a 3 avisos altos de la cadena de desarrollo `vite-plugin-singlefile → micromatch → braces`. No se aplicó el downgrade incompatible sugerido por `--force`. Esta cadena se usa al compilar con patrones del repositorio; no se afirma ausencia de riesgo.

No se prueba aquí el reinicio automático del modelo en cada host ni una entrevista completa en la instalación viva del usuario. La recuperación temporal sigue limitada a 20 sesiones y 24 horas, y no sustituye el estado durable del proyecto. Un timeout limita la espera del cliente; no cancela una operación remota ya iniciada.
