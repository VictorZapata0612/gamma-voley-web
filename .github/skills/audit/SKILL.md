---
name: audit
description: "Auditoría acotada y de solo lectura de una función Gamma Voley."
disable-model-invocation: true
---
Audita solo esta función: ${input:feature:Función o flujo a revisar}

Repositorio: ${input:repository:mobile o web}

Lee las instrucciones del repositorio y usa la skill `audit-project`. Inspecciona primero las rutas directamente relacionadas; amplía solo para seguir una dependencia concreta. Contrasta cada conclusión con el checkout activo. No edites archivos, no instales paquetes y no cambies datos/configuración.

Si la auditoría toca sincronización, invoca también `realtime-sync`. Si afecta equipos, grupos, tabla o cuadro, invoca `tournament-10-teams`.

Entrega únicamente:
1. Alcance/rutas inspeccionadas.
2. Hallazgos comprobados, cada uno con ruta, ubicación y evidencia.
3. Hipótesis separadas de hechos y nivel de impacto.
4. Pruebas/comportamientos no verificados y por qué.
5. Recomendaciones sin implementarlas.
6. Decisiones que debe confirmar la organización.

No declares la funcionalidad correcta solo porque exista una conexión Supabase o porque el código compile. No propongas el formato deportivo como si fuera oficial.
