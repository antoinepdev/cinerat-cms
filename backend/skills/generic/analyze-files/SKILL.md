---
name: analyze-files
description: Define el alcance y la forma de analizar archivos o módulos. Úsala siempre que te pidan tu opinión o un análisis de código, archivos, carpetas o módulos ("qué te parece X", "analiza X", "revisa X", "evalúa X"). Antes de analizar, pregunta SIEMPRE a qué escala hacerlo.
---

# Analyze files

Reglas que definen el alcance y la forma del análisis de archivos o módulos a petición del usuario.

## Pregunta la escala antes de analizar

- Antes de leer o analizar cualquier archivo, pregunta SIEMPRE a qué escala analizar, usando la herramienta `question`.
- Puedes localizar los archivos involucrados (por nombre o ruta) para saber cuáles son, pero NO leas su contenido hasta conocer la escala.
- Las escalas son:
	- **Local**: solo los archivos involucrados. No leas ningún otro archivo: ni los que los importan ni de los que dependen, ni sus tests.
	- **Local + tests**: lo anterior, más los tests unitarios de esos archivos (si existen). No leas ningún otro archivo.
	- **Global**: los archivos involucrados, más los componentes que los usan (consumidores) y de los que dependen (dependencias), y cómo se relacionan entre sí.
- Si el usuario ya indica la escala en su petición, NO preguntes: analiza directamente a esa escala.
- Respeta estrictamente la escala elegida: no leas ni analices archivos fuera de su alcance.

## Cómo analizar (solo en Local y Local + tests)

- En **Local** y **Local + tests**, centra el análisis en la sintaxis de los archivos.
- No basta con que la sintaxis sea correcta: busca en las *available skills* las que dicten cómo escribir y/o estructurar código y carga solo las que estén relacionadas con el archivo analizado.
- Usa esas skills como criterio del análisis, nunca para ampliar el alcance de lectura.

## Alcance de esta skill

- En **Global**, esta skill solo acota la lectura: no define cómo analizar los archivos.
- No reemplaza ninguna otra instrucción ni regla: fijar el alcance no exime de aplicar todas las demás que correspondan.
- Reducir el alcance de lectura nunca reduce la calidad del análisis: igual rigor y mismas opiniones que sin esta skill.
