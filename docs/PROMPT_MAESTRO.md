# Gamma Voley — Prompt maestro de trabajo

## Propósito
Mantener el trabajo de Copilot enfocado y consistente entre la aplicación logística móvil y la web pública de espectadores. La app móvil administra datos del torneo y funciona con almacenamiento local SQLite según el snapshot. La web pública muestra calendario, resultados/marcador y tablas mediante Supabase según los componentes del snapshot. Verifica todo en el checkout activo: los snapshots Repomix son históricos, pueden omitir archivos y no prueban el estado actual.

## Fuentes y decisiones comprobadas
- Torneo Mixto Gamma Voley 2026; el README del snapshot indica fechas 14–15 de noviembre de 2026.
- La cantidad actual solicitada por el usuario es **10 equipos**.
- El README móvil del snapshot describe un formato anterior de 8 equipos: dos grupos de cuatro, 12 partidos de grupo, dos mejores de cada grupo a semifinales cruzadas (A1–B2 y B1–A2) y final. Hay además constantes, textos y validaciones que exigen ocho. Esto es evidencia del snapshot anterior, no una regla válida automáticamente para la nueva edición.
- Reglas de puntuación que aparecen en el README snapshot: fase de grupos a dos sets de 15 con prórroga descrita; puntos de tabla 3/2/1/0 según resultado; desempate por diferencial y empate restante a decisión administrativa; playoffs al mejor de tres sets a 21; walkover según fase. Confirma si continúan vigentes para el torneo de 10 equipos antes de modificarlas.
- El snapshot móvil muestra SQLite, cola local, provider Supabase, `apply_score_event` y un hook periódico; el snapshot web usa cliente Supabase y componentes con consulta/suscripción. Son indicios para investigar, no garantía de funcionamiento.

## Decisiones pendientes: no inventar
**Formato oficial para 10 equipos:** [PENDIENTE DE CONFIRMACIÓN]

Confirmar con la organización, antes de implementar grupos o cuadro:
1. Fase inicial: grupos (cuántos y cuántos equipos) o todos contra todos u otro formato.
2. Quién clasifica, orden/siembra y cuadro de playoffs; byes y número de partidos.
3. Reglas de desempate, incluyendo partidos/puntos diferenciales y empates que requieren decisión administrativa.
4. Qué hacer con equipos retirados, ausentes o menos de 10 inscritos.
5. Si las reglas de puntuación, sets y W.O. del formato anterior siguen vigentes.

Si docs y código no resuelven una respuesta, detén únicamente el cambio dependiente y solicita esa decisión. Auditorías de impacto sí pueden continuar como solo lectura.

## Estado y fases
- El usuario indica que el trabajo vigente es la **Fase 6: sincronización en tiempo real entre dispositivos**. Continúa desde ahí; no reinicies la Fase 1 ni reabras fases completadas salvo defecto demostrado y autorización.
- La Fase 6 debe comprobar el recorrido completo: escritura local, cola/outbox, transmisión remota, errores/reintentos/idempotencia, lectura/suscripción en espectadores, reconexión, reconciliación y consistencia entre móvil y web.
- El snapshot contiene un comentario `FASE 7` para playoffs. No es autorización para iniciar esa fase. **No avances a Fase 7 sin autorización expresa del usuario.** El trabajo sobre 10 equipos puede requerir reglas de torneo, pero primero audita y deja lo no definido como decisión pendiente.
- Fases anteriores a la 6 y su estado detallado: [NO INCLUIDOS EN LOS SNAPSHOTS DISPONIBLES; recuperar del prompt maestro o historial vigente antes de marcar como completados].

## Separación de productos
- **Móvil logística:** registrar y administrar torneo, operación offline, almacenamiento y envío remoto. Mantener patrones Expo/React Native/Expo Router y reglas del `AGENTS.md` real.
- **Web pública:** experiencia de consulta para usuarios externos a logística; muestra datos publicados y se actualiza con el contrato confirmado. No añadir gestión interna ni permisos administrativos sin requisito.
- **Supabase:** punto común solo en la medida demostrada por esquema/configuración actuales. Verificar tablas, canales, filtros, RPC y RLS en documentación/migraciones activas; no inferir el contrato únicamente de los snapshots.

## Método de trabajo en Copilot
1. Define un síntoma o cambio pequeño y el repositorio afectado (móvil/web).
2. Lee instrucciones locales, documentación vigente y estado del árbol; revisa solo archivos relacionados.
3. Para auditorías, usa Ask y skill `audit-project`: solo lectura, evidencias y ubicaciones, sin cambios.
4. Para sincronización, traza productor→persistencia/cola→remoto→cada lector; identifica causa antes de editar.
5. Para torneo, busca cada supuesto heredado de 8 equipos. Si la decisión afecta formato o regla oficial sin definir, pregunta antes de codificarla.
6. Implementa solo el cambio acotado acordado, añade pruebas focalizadas y ejecuta las comprobaciones pertinentes indicadas por el repo.
7. Revisa el diff y reporta archivos, evidencia, pruebas ejecutadas con resultados y pendientes. No proclames calidad perfecta ni éxito end-to-end a partir de compilación o pruebas unitarias aisladas.

## Límites
No añadir dependencias, cambiar esquemas o políticas de producción, alterar credenciales, borrar datos ni hacer refactorizaciones amplias fuera del alcance. Nunca registrar claves o información sensible. Preserva cambios del usuario.

## Plantilla de cierre
- Objetivo y alcance:
- Hallazgos/cambio y causa:
- Archivos afectados:
- Validaciones ejecutadas y resultado real:
- Validaciones de dispositivos/entorno pendientes:
- Decisiones de organización pendientes:
- Riesgo residual y siguiente paso autorizado:
