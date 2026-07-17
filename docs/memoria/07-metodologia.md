# Capítulo 7. El Proceso: Desarrollo Asistido por IA

## 7.1. El método como objeto de estudio

Los capítulos anteriores han demostrado *qué* se construyó y con *qué* calidad. Este capítulo aborda el **cómo**, que es la contribución metodológica del trabajo: el sistema no se desarrolló de forma convencional, sino mediante un **proceso guiado por Inteligencia Artificial** —modelos de lenguaje y agentes— sometido a una **disciplina de ingeniería explícita**. La hipótesis que el Trabajo pone a prueba, enunciada en el Capítulo 1, es que ese binomio —IA + disciplina— permite producir software no trivial y de calidad de producción, y que su principal riesgo —la generación de código *plausible pero superficial o inseguro*, documentado empíricamente en el Capítulo 2 [20]— se mitiga con mecanismos concretos y verificables.

A diferencia de una afirmación de intenciones, el proceso dejó **artefactos versionados** que un evaluador puede inspeccionar directamente en el repositorio: los **planes de diseño e implementación** (`docs/plans/`), los **documentos de revisión** (`docs/reviews/`) y el **registro de desviaciones** (`docs/plans/2026-02-20-mvp-deviations.md`). Este capítulo los narra y analiza.

## 7.2. El flujo de trabajo

El desarrollo siguió un ciclo repetido para cada funcionalidad de entidad, en lugar de una generación de código *ad hoc*:

1. **Conceptualización (*brainstorming*).** Antes de escribir código, un diálogo dirigido convierte la idea en un diseño: se exploran 2-3 enfoques, se contrastan sus compromisos y se elige uno de forma razonada. La regla es estricta: **no se implementa nada sin un diseño aprobado**, por simple que parezca la funcionalidad.
2. **Plan de implementación.** El diseño se traduce en un plan de tareas *bite-sized* con rutas de fichero exactas, pruebas a escribir y comandos de verificación. Los planes se conservan en `docs/plans/` (p. ej. `2026-07-10-owasp-security-hardening.md`, `2026-07-13-superadmin-dashboard.md`) y funcionan como especificación ejecutable y como trazabilidad del razonamiento.
3. **Implementación guiada por pruebas (TDD).** En las capas de dominio y aplicación, la prueba precede a la implementación (Capítulo 6). La IA escribe primero la especificación ejecutable y luego el código mínimo que la satisface; la puerta de cobertura en integración continua impide que esta disciplina se relaje.
4. **Revisión adversarial.** El resultado se somete a un escrutinio deliberadamente hostil —descrito en §7.4—, cuyos hallazgos se documentan en `docs/reviews/`.
5. **Registro de desviaciones.** Cuando la realidad obliga a apartarse del plan, la desviación se anota con su justificación (§7.5), evitando la ficción de un proceso perfecto.

La cadena de calidad automatizada del Capítulo 6 —análisis estático estricto, pirámide de pruebas, cobertura como puerta y despliegue continuo— es el sustrato que hace **seguro** este flujo: cada cambio propuesto por la IA se enfrenta a una batería de verificaciones antes de integrarse.

## 7.3. Las herramientas

El asistente principal fue **Claude** (Anthropic), empleado tanto en modo conversacional para el diseño como a través de un **agente de codificación** con acceso al sistema de ficheros, la terminal y el control de versiones. El agente no operó de forma autónoma sin supervisión: cada acción con efectos —una migración, un *push*, un despliegue— quedó sujeta a aprobación, y las decisiones de arquitectura se validaron antes de escribirse.

Es importante delimitar el papel de la IA con honestidad. La IA **redactó** diseños, planes, código y pruebas, y **ejecutó** verificaciones; pero la **disciplina** que acota su tendencia a lo superficial —las fronteras de la Arquitectura Limpia, el TDD, la revisión documentada— es precisamente lo que este trabajo aporta como método. La IA es el motor; la disciplina, el chasis.

## 7.4. La revisión adversarial como control de calidad

El mecanismo más característico del proceso es el uso de **agentes de revisión adversariales**: instancias nuevas, sin el sesgo de haber escrito el código, con el mandato explícito de **refutar** una decisión o encontrar sus defectos, en lugar de confirmarla. Se aplicó en dos momentos:

- **Sobre el diseño**, antes de implementar. Ejemplo real y documentado: en el diseño del panel de operador (§5.10), la primera propuesta protegía la columna `active` revocando el privilegio `UPDATE` de columna al rol `authenticated`. Una revisión adversarial del diseño demostró que en PostgreSQL el privilegio `UPDATE` a nivel de tabla **domina** sobre el `REVOKE` de columna, de modo que el dueño habría podido reactivarse. El fallo se corrigió —un *trigger* `BEFORE UPDATE`— **antes de escribir una sola línea**, no en producción.
- **Sobre la implementación**, antes de dar por buena una funcionalidad. Las revisiones detectaron, entre otros, una **paginación sin orden estable** que podía saltar filas *cross-tenant*, y una **recursión mutua entre políticas RLS** que rompía el panel y el portal bajo RLS activa —un defecto que el flujo público, al operar con rol de servicio, no exhibía, y que por tanto una verificación ingenua no habría encontrado—.

Estas revisiones no son anecdóticas: constituyen la respuesta operativa al riesgo central de la IA. Cuando un agente genera código *plausible*, otro agente —o el mismo bajo una consigna hostil— es una forma barata y efectiva de exponer lo *incorrecto*. Sus veredictos y correcciones se conservan en `docs/reviews/`.

## 7.5. Desviaciones: documentar la imperfección

Un proceso honesto no oculta dónde se apartó de su plan. El fichero `docs/plans/2026-02-20-mvp-deviations.md` registra, desde el MVP, las desviaciones conscientes respecto al diseño inicial, con su motivo. La más significativa —la **coherencia arquitectónica parcial en la rama de administración**, donde ciertas *Server Actions* acceden a la persistencia sin atravesar un caso de uso— se declara aquí y se reconoce como limitación en el Capítulo 8, en lugar de barrerse bajo la alfombra. Esta trazabilidad de las desviaciones es, en sí misma, evidencia de que el proceso se condujo con criterio y no como una aceptación acrítica de lo que la IA proponía.

## 7.6. Métricas y valoración del proceso

El proceso dejó una huella cuantificable en el repositorio:

| Artefacto | Volumen | Ubicación |
|-----------|---------|-----------|
| Planes de diseño e implementación | 13 documentos | `docs/plans/` |
| Documentos de revisión | 2 iniciales + múltiples revisiones adversariales por funcionalidad | `docs/reviews/` |
| Registro de desviaciones | 1 documento vivo | `docs/plans/…mvp-deviations.md` |
| Migraciones versionadas | 14 | `supabase/migrations/` |
| Pruebas automatizadas | 325 en 46 ficheros | `src/**/*.test.ts` |

> *Tabla 7.1. Artefactos del proceso asistido por IA, verificables en el repositorio.*

La lectura de estas cifras junto con los capítulos previos sostiene la tesis: la elección de **soluciones técnicamente exigentes y correctas** —la restricción de exclusión para la concurrencia, el patrón *claim-and-release* para la idempotencia, el modelado del tiempo como aritmética entera de minutos— demuestra que el proceso asistido por IA fue capaz de abordar la **complejidad esencial** del dominio, no solo la accidental. Y lo hizo sin renunciar a la trazabilidad: cada una de esas decisiones nació en un plan, se implementó con pruebas y se sometió a revisión. La valoración metodológica final —el grado en que esta evidencia respalda la hipótesis— se recoge en el Capítulo 8.

Como línea futura (§8.4) queda una **cuantificación más fina del proceso** —cobertura por fase, defectos detectados en revisión frente a los que llegaron a integración, *commits* por funcionalidad—, que convertiría esta huella cualitativa en un estudio metodológico plenamente métrico.

---

[◀ Capítulo 6. Estrategia de Pruebas y Control de Calidad](06-pruebas-calidad.md) · [🏠 Índice](README.md) · [Capítulo 8. Conclusiones y Líneas Futuras ▶](08-conclusiones.md)
