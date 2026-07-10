# Capítulo 7. Conclusiones y Líneas Futuras

## 7.1. Grado de cumplimiento de los objetivos

El presente trabajo se propuso, en su Capítulo 1, un objetivo general doble —construir una plataforma SaaS de reservas de calidad de producción y, simultáneamente, validar un proceso de desarrollo asistido por IA centrado en la calidad— desplegado en una serie de objetivos específicos y metodológicos. La siguiente tabla valora su grado de cumplimiento frente a la evidencia del repositorio.

| Objetivo | Estado | Evidencia |
|----------|--------|-----------|
| OE-1. Arquitectura Limpia con capas estrictas | **Cumplido** (con desviación acotada) | `src/domain`, `application`, `infrastructure`, `app`; dominio sin dependencias de *framework*. Desviación: rama de administración (§4.5) |
| OE-2. Modelado del dominio (entidades, VO, servicios) | **Cumplido** | 5 objetos de valor con invariantes; servicios `availability-calculator`, `tenant-clock`, `plan-limits` |
| OE-3. Integridad ante concurrencia en la BD | **Cumplido** | Restricción `EXCLUDE`/`btree_gist` → `SlotTakenError` (§5.3) |
| OE-4. Multi-tenancy con RLS | **Cumplido** | RLS acotada a **propietario + titular** en 5 tablas; fuga de PII cerrada (§5.7, [Anexo E](09-anexos.md)) |
| OE-5. Pagos B2B2C con Stripe Connect | **Cumplido** (monetización inactiva) | Cuenta de destino + comisión; confirmación por *webhook* firmado. Plan `PRO` no persistido (§5.5) |
| OE-6. Internacionalización (es-ES/en-US) | **Cumplido** | `infrastructure/i18n`, correos traducidos |
| OE-7. Despliegue *serverless* | **Cumplido** | Vercel; `https://reservas-chanantes.vercel.app/` |
| OM-1. TDD en dominio y aplicación | **Cumplido** | 279 pruebas; 66 % en dominio/aplicación; cobertura con umbral (90/80), Testing Library, CI y E2E cross-browser (§6.7) |
| OM-2. Trazabilidad del proceso asistido por IA | **Cumplido** | `docs/plans/`, `docs/reviews/`, `mvp-deviations.md` |
| OM-3. Documentación honesta de limitaciones | **Cumplido** | Capítulos 4–7 |

> *Tabla 7.1. Grado de cumplimiento de los objetivos planteados.*

El balance es **mayoritariamente satisfactorio**: de diez objetivos, ocho se cumplen plenamente —incluida ya la multi-tenancy, cuya RLS se ha acotado a propietario y titular—, uno lo hace de forma honestamente acotada (la monetización por plan, diseñada pero inactiva) y uno presenta una desviación arquitectónica documentada (acceso directo a repositorios en administración). Ninguna de estas brechas compromete el funcionamiento del producto en su alcance de MVP, y todas se reconocen explícitamente —lo que, lejos de restar valor, refuerza el objetivo metodológico OM-3.

## 7.2. Valoración metodológica

El verdadero objeto de estudio del trabajo —la **viabilidad del desarrollo de software guiado por IA priorizando la máxima calidad**— admite una valoración positiva sustentada en hechos verificables, no en impresiones:

- La **arquitectura desacoplada** no es declarativa, sino comprobable: el dominio no importa ninguna dependencia de *framework*, y esa propiedad habilitó una pirámide de pruebas de base ancha.
- La **calidad se tradujo en artefactos**: 279 pruebas, 11 migraciones versionadas, y una trazabilidad del proceso (planes, revisiones, registro de desviaciones) que documenta no solo *qué* se construyó, sino *cómo* se decidió.
- La elección de soluciones **técnicamente exigentes y correctas** —la restricción de exclusión para la concurrencia, el patrón *claim-and-release* para la idempotencia, el modelado del tiempo como aritmética entera— demuestra que el proceso asistido por IA fue capaz de abordar la complejidad esencial del dominio, no solo la accidental.

La conclusión metodológica es que el desarrollo asistido por IA, **conducido bajo una disciplina de ingeniería explícita**, es viable para producir software de calidad de producción; y que su principal riesgo —la generación de código plausible pero superficial— se mitiga precisamente con los mecanismos que este trabajo adoptó: TDD, fronteras arquitectónicas estrictas y revisión documentada.

## 7.3. Limitaciones del trabajo

Se consolidan aquí, de forma transparente, las limitaciones señaladas a lo largo de la memoria. La deuda de seguridad más señalada en versiones anteriores —las políticas RLS permisivas sobre `bookings`/`customers`— ha sido **subsanada** con el paquete de endurecimiento OWASP (§5.7, [Anexo E](09-anexos.md)), por lo que ya no figura en esta lista.

1. **Monetización no funcional**: ausencia de columna `plan`; todo *tenant* resuelve a `FREE` (§5.5).
2. **Arquitectura Limpia parcial en presentación**: los *Server Actions* de administración acceden directamente a los repositorios (§4.5).
3. **Defecto conocido de zona horaria**: derivación del día de la semana con `getUTCDay()` (§5.4).
4. **Sin pruebas de integración contra base de datos real**: los adaptadores de persistencia se prueban con dobles (*mocks*); la restricción `EXCLUDE` y las políticas RLS se validan a ese nivel solo indirectamente, no contra un PostgreSQL efímero (§6.7, Anexo F). *(El resto del marco de calidad —CI, E2E automatizado y umbral de cobertura— ya está en marcha.)*
5. **Monitorización basada en trazas**: el registro de eventos de seguridad ya es **estructurado** (`logSecurityEvent`, con lista blanca de campos; Anexo E), pero la observabilidad carece todavía de alertado y de una plataforma de APM (p. ej. un DSN de Sentry).

## 7.4. Líneas futuras

Las líneas de evolución se priorizan por su **retorno** —tanto de producto como académico—.

### 7.4.1. Prioridad alta (refuerzo de la calidad declarada)

1. **Endurecimiento de la seguridad (realizado) y su continuación.** El paquete de seguridad OWASP ya está **aplicado** (rama `security/owasp-hardening`; evaluación por categoría en el [Anexo E](09-anexos.md)): se **acotó la RLS** de `bookings`/`customers` a propietario y titular —cerrando la fuga de PII por la clave anónima—, y se incorporaron **limitación de tasa** (*rate limiting*), **cabeceras de seguridad y CSP**, una **política de contraseñas fuerte** (12+, complejidad), la **validación del entorno con Zod** (*fail-first*) y el **registro estructurado de eventos de seguridad**. Como continuación restan las **claves de idempotencia** en las operaciones salientes de Stripe y, sobre la base de esta evaluación OWASP, la redacción de un **capítulo de modelado de amenazas**.
2. **Pruebas de integración contra base de datos real.** La integración continua (GitHub Actions: `lint → tsc → vitest --coverage` con umbral), las **pruebas E2E de Playwright** y el gate de cobertura ya están operativos (§6.7); el siguiente refuerzo natural es ejercitar la restricción `EXCLUDE` y las políticas RLS **de extremo a extremo contra un PostgreSQL efímero**, hoy verificadas solo con dobles de prueba.

### 7.4.2. Prioridad media (completar el producto)

3. **Activar la monetización**: añadir la columna `plan`, su flujo de suscripción y la aplicación efectiva de límites y comisiones por plan, dando vida al servicio `plan-limits` ya diseñado.
4. **Sanear la coherencia arquitectónica**: encauzar los *Server Actions* de administración a través de casos de uso, eliminando el acceso directo a repositorios.
5. **Corregir el defecto de zona horaria** en la derivación del día de la semana.

### 7.4.3. Prioridad baja (madurez operativa)

6. **Observabilidad**: sobre el registro estructurado de eventos de seguridad ya existente (Anexo E), incorporar **alertado y APM** (p. ej. Sentry) y métricas de negocio.
7. **Capítulo de métricas de metodología**: cuantificar el desarrollo asistido por IA (cobertura por fase, defectos detectados en revisión, *commits* por funcionalidad) a partir de los artefactos de `docs/`.

## 7.5. Conclusión final

El proyecto **Reservas Chanantes** alcanza su doble objetivo: entrega una plataforma SaaS multi-tenant de reservas funcional y desplegada, y lo hace sobre una base de ingeniería —Arquitectura Limpia, TDD, integridad garantizada en la base de datos— cuya solidez es verificable en el código y en una batería de 279 pruebas. Igual de relevante para un Trabajo de Fin de Máster es que sus limitaciones se han identificado y documentado con honestidad, trazando un camino de evolución claro. El trabajo sostiene, en definitiva, su tesis central: el desarrollo de software guiado por Inteligencia Artificial, cuando se somete a una disciplina de calidad explícita, es una vía viable para construir sistemas no triviales y bien fundamentados.

---

[◀ Capítulo 6. Estrategia de Pruebas y Control de Calidad](06-pruebas-calidad.md) · [🏠 Índice](README.md) · [Bibliografía ▶](08-bibliografia.md)
