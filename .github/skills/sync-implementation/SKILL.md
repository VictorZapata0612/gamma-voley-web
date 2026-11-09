---
name: sync-implementation
description: "Implementa un cambio pequeño de sincronización en tiempo real después de revisar el flujo actual y acordar su alcance."
disable-model-invocation: true
---
Objetivo concreto: ${input:change:Un fallo observable de sincronización}
Criterios de aceptación: ${input:acceptance:Criterios observables}

Trabaja en el repositorio actual únicamente. Sigue las instrucciones y consulta la skill `realtime-sync`. Si falta evidencia del fallo, primero investiga y presenta una propuesta breve; no cambies código a ciegas.

Antes de editar:
- Identifica el recorrido real: acción de escritura → persistencia local (si aplica) → cola/evento → remoto → suscripción/consulta lectora → UI de cada dispositivo.
- Señala archivos y causa probable con evidencia.
- Define el cambio mínimo y las pruebas focalizadas. No alteres el esquema, políticas, RPC, reglas del torneo ni formatos de payload fuera del alcance.
- Conserva trabajo preexistente en el árbol.

Implementa solo el cambio acordado y añade/corrige pruebas que capturen la regresión. Verifica idempotencia, duplicados, errores, reintentos/reconexión y limpieza de suscripciones según el flujo afectado. Ejecuta comandos existentes y pertinentes; reporta exactamente resultados y limitaciones. No simules pruebas remotas si no hay entorno disponible.

Al terminar: resume causa, cambio, archivos, pruebas ejecutadas, resultado y riesgos restantes. No declares sincronización integral validada por una prueba unitaria aislada. Mantente en Fase 6; no avances a Fase 7.
