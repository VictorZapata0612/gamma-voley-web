---
name: tournament-10-teams
description: Audita impactos del cambio a 10 equipos en inscripción, grupos, calendario, resultados, clasificación, cuadro e interfaces sin inventar reglas no confirmadas.
---

# Auditoría del torneo de 10 equipos

## Regla de autoridad
El conteo de participantes es 10 según el usuario. El formato de competición de 10 equipos y las reglas deportivas oficiales no están especificados aquí. El snapshot móvil anterior describe dos grupos de cuatro, 12 partidos y semifinales cruzadas; ese estado no autoriza a extrapolar a dos grupos de cinco ni a otro formato.

Busca la documentación oficial vigente y configuración activa. Si el formato, clasificatorios o desempates no están expresos o se contradicen, reporta la decisión necesaria y no implementes lógica de cuadro.

## Mapa de impactos
Revisa, según exista en el repo: límite de inscripción/validación; capacidad y asignación de grupos; generación/calendario de partidos; estados de bye/partido incompleto; scoring y walkover; elegibilidad y cierre de grupos; standings, desempates y empates administrativos; generación/revisión de playoffs; reportes/exportación; UI, conteos, etiquetas y pruebas. Busca constantes y textos heredados de 8, 4, 12 y 2 clasificados.

## Forma de trabajo
- Primero auditoría de solo lectura y lista de evidencia, incluyendo rutas y líneas.
- Distingue lógica deportiva, persistencia y presentación.
- Comprueba invariantes con cantidades derivadas solo tras confirmar formato (p. ej. número de partidos por grupo todos-contra-todos depende del tamaño del grupo).
- No migres datos ni cambies el bracket por intuición. Formula preguntas precisas a organización sobre formato, clasificación, orden/siembra, desempates, byes y manejo de equipos faltantes.
- Tras confirmación, propone un cambio pequeño con pruebas de dominio y cobertura de bordes antes de implementación.
