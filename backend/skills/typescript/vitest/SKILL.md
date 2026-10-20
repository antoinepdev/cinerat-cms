---
name: vitest
description: Reglas de estructura para tests con el framework Vitest. Úsala siempre que escribas, revises o modifiques tests: se mencione Vitest o se vean describe, it, test, it.for, expect, vi.*.

---

# Vitest

Reglas para escribir tests con Vitest. Se aplican siempre salvo que el usuario indique lo contrario.

- Todo archivo de test DEBE llevar `.test` en su nombre. Ejemplo: `example.test.ts`.
- Dentro de un `describe` usa `it`; fuera de un `describe` usa `test`.
- Siempre que se puedan agrupar cases, DEBE usar `it.for` con casos objeto `{}` y su generic de tipado.
