# Capítulo 7. Conclusiones y Líneas Futuras

## 7.1. Grado de cumplimiento de los objetivos

El presente trabajo se propuso, en su Capítulo 1, un objetivo general doble —construir una plataforma SaaS de reservas de calidad de producción y, simultáneamente, validar un proceso de desarrollo asistido por IA centrado en la calidad— desplegado en una serie de objetivos específicos y metodológicos. La siguiente tabla valora su grado de cumplimiento frente a la evidencia del repositorio.

| Objetivo | Estado | Evidencia |
|----------|--------|-----------|
| OE-1. Arquitectura Limpia con capas estrictas | **Cumplido** (con desviación acotada) | `src/domain`, `application`, `infrastructure`, `app`; dominio sin dependencias de *framework*. Desviación: rama de administración (§4.5) |
| OE-2. Modelado del dominio (entidades, VO, servicios) | **Cumplido** | 5 objetos de valor con invariantes; servicios `availability-calculator`, `tenant-clock`, `plan-limits` |
| OE-3. Integridad ante concurrencia en la BD | **Cumplido** | Restricción `EXCLUDE`/`btree_gist` → `SlotTakenError` (§5.3) |
| OE-4. Multi-tenancy con RLS | **Parcialmente cumplido** | RLS en 5 tablas; políticas permisivas en `bookings`/`customers` (§5.7) |
| OE-5. Pagos B2B2C con Stripe Connect | **Cumplido** (monetización inactiva) | Cuenta de destino + comisión; confirmación por *webhook* firmado. Plan `PRO` no persistido (§5.5) |
| OE-6. Internacionalización (es-ES/en-US) | **Cumplido** | `infrastructure/i18n`, correos traducidos |
| OE-7. Despliegue *serverless* | **Cumplido** | Vercel; `https://reservas-chanantes.vercel.app/` |
| OM-1. TDD en dominio y aplicación | **Cumplido** | 202 pruebas; 85 % en dominio/aplicación (§6.3) |
| OM-2. Trazabilidad del proceso asistido por IA | **Cumplido** | `docs/plans/`, `docs/reviews/`, `mvp-deviations.md` |
| OM-3. Documentación honesta de limitaciones | **Cumplido** | Capítulos 4–7 |

> *Tabla 7.1. Grado de cumplimiento de los objetivos planteados.*

El balance es **mayoritariamente satisfactorio**: de diez objetivos, siete se cumplen plenamente, dos lo hacen de forma parcial pero honestamente acotada (RLS y monetización) y uno presenta una desviación arquitectónica documentada (acceso directo a repositorios en administración). Ninguna de estas brechas compromete el funcionamiento del producto en su alcance de MVP, y todas se reconocen explícitamente —lo que, lejos de restar valor, refuerza el objetivo metodológico OM-3.

## 7.2. Valoración metodológica

El verdadero objeto de estudio del trabajo —la **viabilidad del desarrollo de software guiado por IA priorizando la máxima calidad**— admite una valoración positiva sustentada en hechos verificables, no en impresiones:

- La **arquitectura desacoplada** no es declarativa, sino comprobable: el dominio no importa ninguna dependencia de *framework*, y esa propiedad habilitó una pirámide de pruebas de base ancha.
- La **calidad se tradujo en artefactos**: 202 pruebas, 10 migraciones versionadas, y una trazabilidad del proceso (planes, revisiones, registro de desviaciones) que documenta no solo *qué* se construyó, sino *cómo* se decidió.
- La elección de soluciones **técnicamente exigentes y correctas** —la restricción de exclusión para la concurrencia, el patrón *claim-and-release* para la idempotencia, el modelado del tiempo como aritmética entera— demuestra que el proceso asistido por IA fue capaz de abordar la complejidad esencial del dominio, no solo la accidental.

La conclusión metodológica es que el desarrollo asistido por IA, **conducido bajo una disciplina de ingeniería explícita**, es viable para producir software de calidad de producción; y que su principal riesgo —la generación de código plausible pero superficial— se mitiga precisamente con los mecanismos que este trabajo adoptó: TDD, fronteras arquitectónicas estrictas y revisión documentada.

## 7.3. Limitaciones del trabajo

Se consolidan aquí, de forma transparente, las limitaciones señaladas a lo largo de la memoria:

1. **Aislamiento multi-tenant incompleto**: las políticas RLS de `bookings` y `customers` son permisivas (§5.7).
2. **Monetización no funcional**: ausencia de columna `plan`; todo *tenant* resuelve a `FREE` (§5.5).
3. **Arquitectura Limpia parcial en presentación**: los *Server Actions* de administración acceden directamente a los repositorios (§4.5).
4. **Defecto conocido de zona horaria**: derivación del día de la semana con `getUTCDay()` (§5.4).
5. **Marco de calidad sin automatizar**: sin CI/CD, sin E2E automatizado, sin umbral de cobertura (§6.7).
6. **Observabilidad mínima**: el registro se limita a `console.error`, sin trazas estructuradas ni métricas.

## 7.4. Líneas futuras

Las líneas de evolución se priorizan por su **retorno** —tanto de producto como académico—.

### 7.4.1. Prioridad alta (refuerzo de la calidad declarada)

1. **Endurecimiento de la seguridad y la multi-tenancy.** Reescribir las políticas RLS de `bookings`/`customers` para acotar el acceso anónimo a lo estrictamente necesario; añadir **claves de idempotencia** en las operaciones de Stripe; escapar el HTML en los correos; e introducir limitación de tasa (*rate limiting*). Este conjunto —cuya evaluación por categoría OWASP figura en el [Anexo E](09-anexos.md)— habilitaría un **capítulo de modelado de amenazas**.
2. **Integración continua, E2E y cobertura.** Configurar un flujo de GitHub Actions que ejecute, en cada cambio, `lint → tsc --noEmit → vitest --coverage` con un **umbral de cobertura** (orientativo, ~85 % en dominio y aplicación), complementado con **pruebas Playwright** automatizadas del flujo de reserva de extremo a extremo. Es la línea de mayor retorno: convierte la calidad practicada en calidad **medida y forzada**.

### 7.4.2. Prioridad media (completar el producto)

3. **Activar la monetización**: añadir la columna `plan`, su flujo de suscripción y la aplicación efectiva de límites y comisiones por plan, dando vida al servicio `plan-limits` ya diseñado.
4. **Sanear la coherencia arquitectónica**: encauzar los *Server Actions* de administración a través de casos de uso, eliminando el acceso directo a repositorios.
5. **Corregir el defecto de zona horaria** en la derivación del día de la semana.

### 7.4.3. Prioridad baja (madurez operativa)

6. **Observabilidad**: incorporar trazas estructuradas y métricas.
7. **Capítulo de métricas de metodología**: cuantificar el desarrollo asistido por IA (cobertura por fase, defectos detectados en revisión, *commits* por funcionalidad) a partir de los artefactos de `docs/`.

## 7.5. Conclusión final

El proyecto **Reservas Chanantes** alcanza su doble objetivo: entrega una plataforma SaaS multi-tenant de reservas funcional y desplegada, y lo hace sobre una base de ingeniería —Arquitectura Limpia, TDD, integridad garantizada en la base de datos— cuya solidez es verificable en el código y en una batería de 202 pruebas. Igual de relevante para un Trabajo de Fin de Máster es que sus limitaciones se han identificado y documentado con honestidad, trazando un camino de evolución claro. El trabajo sostiene, en definitiva, su tesis central: el desarrollo de software guiado por Inteligencia Artificial, cuando se somete a una disciplina de calidad explícita, es una vía viable para construir sistemas no triviales y bien fundamentados.

---

[◀ Capítulo 6. Estrategia de Pruebas y Control de Calidad](06-pruebas-calidad.md) · [🏠 Índice](README.md) · [Bibliografía ▶](08-bibliografia.md)
