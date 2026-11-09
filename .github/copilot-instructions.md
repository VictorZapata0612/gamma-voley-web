# Copilot — web pública Gamma Voley

## Orden y contexto
- Confirma que estás en el repositorio de la web pública Vite/React. Inspecciona primero solo las rutas necesarias.
- Lee `docs/PROMPT_MAESTRO.md` y el README disponible. Respeta cualquier `AGENTS.md` existente.
- Repomix es un snapshot histórico y posiblemente incompleto; verifica el checkout actual antes de concluir.
- La web pública consume datos del torneo para espectadores. Mantén su rol de lectura salvo que el requisito vigente diga lo contrario; no agregues funciones de gestión logística.

## Torneo de 10 equipos
- No inventes formato, grupos, clasificados, cuadro, byes ni desempates. Busca fuente oficial actual en documentación/código y pide confirmación si está ausente o contradictoria.
- Audita todas las suposiciones de 8 equipos en tabla, orden, zonas de clasificación, calendario, marcador, estados vacíos y textos de interfaz.
- No cambies lógica de clasificación hasta tener reglas confirmadas. Distingue visualización de reglas deportivas.

## Actualización en vivo
- El snapshot muestra consultas Supabase y canales Realtime en componentes públicos; verifica el código activo.
- Comprueba carga inicial, suscripción y filtros, estado conectado/desconectado, errores, limpieza del canal, reconexión y reconciliación tras reconectar. Evita canales duplicados y actualizaciones fuera del torneo/partido seleccionado.
- La app móvil y la web deben coincidir en los datos publicados. No asumas nombres de tablas, esquema ni payloads a partir del snapshot: contrástalos con la fuente actual.
- No incluyas claves secretas en código público. No cambies RLS, permisos o esquema de producción sin autorización explícita.

## Cambios y validación
- Haz cambios pequeños y solo tras definir criterios de aceptación. Revisa pruebas, scripts y tipos existentes; añade pruebas focalizadas cuando corresponda y ejecútalas.
- No hagas refactorizaciones amplias ni añadas dependencias sin necesidad demostrada.
- Reporta evidencia, archivos tocados, verificaciones ejecutadas y límites. Nunca declares éxito sin comprobarlo.
- El objetivo vigente indicado por el usuario es continuar Fase 6. No reinicies fases ni inicies Fase 7 sin autorización expresa.
