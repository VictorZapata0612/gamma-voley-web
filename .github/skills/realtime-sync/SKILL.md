---
name: realtime-sync
description: Investiga o implementa cambios acotados de sincronización entre móvil, Supabase y web pública. Úsala para cola offline, reintentos, Realtime, reconexión, frescura y consistencia entre dispositivos.
---

# Sincronización en tiempo real

## Método de investigación
1. Establece repositorio, flujo de usuario y síntoma concreto; revisa estado de trabajo y no sobrescribas cambios existentes.
2. Sigue el dato desde el productor hasta todos los lectores. En móvil, verifica SQLite/repositorios, cola/outbox, worker, proveedor remoto y estados de operación. En web, verifica carga inicial, consulta, canal, filtro, estado UI y cleanup. Contrasta nombres/payloads con fuentes actuales.
3. Traza creación y actualización, orden/versión, idempotency key, deduplicación, conflictos y correcciones administrativas. Identifica qué sucede offline, en timeout, respuesta parcial, token expirado y reconexión.
4. Comprueba observabilidad sin exponer secretos/datos personales. Diferencia hechos, hipótesis y condiciones no reproducidas.

## Implementación segura
- Propón primero un cambio mínimo para un síntoma y criterios de aceptación. No reemplaces la arquitectura ni añadas servicios o dependencias sin causa demostrada.
- Mantén la escritura local/respuesta de UI y el contrato de datos vigentes salvo que el cambio aprobado requiera modificarlos.
- No marques como sincronizado un elemento hasta confirmar el contrato de éxito remoto. Protege reintentos contra duplicación y conserva errores recuperables.
- Para Realtime, verifica filtros, orden de eventos, canal por ámbito, cleanup, estado de conexión y reconciliación mediante nueva lectura tras reconexión.
- No cambies esquema, políticas/RLS, RPC, datos reales o credenciales sin aprobación explícita del alcance.

## Validación requerida
- Pruebas focalizadas de éxito, fallo/reintento y duplicado según el cambio.
- Prueba de reconexión y actualización en más de un lector/dispositivo en entorno controlado para afirmar integración; si no es posible, decláralo pendiente.
- Comprueba tipos/lint y pruebas existentes pertinentes; sigue las instrucciones locales.
- Informa comandos/resultados reales, limitaciones y riesgos. No uses “funciona perfectamente” como conclusión sin validación de extremo a extremo.

Fase de trabajo actual: Fase 6, sincronización multidispositivo, según el usuario. No inicies Fase 7 sin autorización.
