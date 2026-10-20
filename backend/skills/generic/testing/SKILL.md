---
name: testing
description: Reglas generales para escribir o revisar tests, sea cual sea el lenguaje o framework. Usa esta skill siempre que escribas, modifiques, revises o corrijas tests, o te pidan tests unitarios, de integración o de endpoints.
---

# Testing

Reglas para escribir tests. Se aplican siempre salvo que el usuario indique lo contrario.

- Los tests SIEMPRE respaldan las reglas de negocio. Un test no comprueba la implementación: comprueba que la implementación refleja la lógica de negocio.
- Los tests SIEMPRE se escriben en inglés.
- Los tests NO deben tener errores de tipado.
- Evita los tipados raros: si para definir un tipo tienes que encadenar un montón de cosas distintas, el problema no son los tests sino la arquitectura existente. En ese caso NIEGATE a escribir el test y señala el problema arquitectónico.
- No uses mocks. Un mock solo se admite si es estrictamente necesario. Si el mock es consecuencia de una decisión arquitectónica, NIEGATE a escribir el test y señala el problema.
- Esta última regla es la más importante: evita archivos de test ilegibles con una complejidad innecesaria alta.
