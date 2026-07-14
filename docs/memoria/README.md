<div align="center">

# Desarrollo de software guiado por Inteligencia Artificial con prioridad en la calidad

### Diseño e implementación de «Reservas Chanantes», una plataforma SaaS *multi-tenant* de reserva de citas en línea

**Trabajo de Fin de Máster**

*Junio de 2026*

</div>

---

## Resumen

Este Trabajo de Fin de Máster aborda el diseño, la implementación y el despliegue de **Reservas Chanantes**, una plataforma **SaaS *multi-tenant*** de reserva de citas en línea para pequeños negocios de servicios, con un modelo de negocio **B2B2C** sustentado en pagos divididos mediante Stripe Connect. Más allá del producto, el trabajo constituye un **caso de estudio** sobre la viabilidad del **desarrollo de software guiado por Inteligencia Artificial cuando se prioriza la máxima calidad de ingeniería**. Para ello, el sistema se construye aplicando de forma rigurosa **Arquitectura Limpia**, **diseño dirigido por el dominio (DDD)** y **desarrollo guiado por pruebas (TDD)**, sobre una pila de TypeScript estricto, Next.js 16 (App Router) y PostgreSQL gestionado por Supabase. Se documentan las decisiones técnicamente no triviales del dominio —el cálculo de disponibilidad, la prevención de reservas solapadas mediante una restricción de exclusión de PostgreSQL, la gestión sensible a la zona horaria y la idempotencia de las notificaciones— y se valida el resultado con una batería de **320 pruebas automatizadas** concentrada en las capas de dominio y aplicación. El trabajo concluye que el desarrollo asistido por IA, sometido a una disciplina de ingeniería explícita, es una vía viable para producir software no trivial y de calidad de producción, y documenta con transparencia sus limitaciones y líneas de evolución.

**Palabras clave:** SaaS *multi-tenant*, Arquitectura Limpia, *Domain-Driven Design*, *Test-Driven Development*, Next.js, PostgreSQL, Stripe Connect, desarrollo asistido por IA, calidad del software.

## Abstract

This Master's Thesis addresses the design, implementation and deployment of **Reservas Chanantes**, a **multi-tenant SaaS** online appointment-booking platform for small service businesses, built on a **B2B2C** business model supported by split payments through Stripe Connect. Beyond the product itself, the work is a **case study** on the feasibility of **AI-guided software development when maximum engineering quality is prioritised**. To this end, the system is built through a rigorous application of **Clean Architecture**, **Domain-Driven Design (DDD)** and **Test-Driven Development (TDD)**, on a stack of strict TypeScript, Next.js 16 (App Router) and PostgreSQL managed by Supabase. The non-trivial domain decisions are documented —availability computation, prevention of overlapping bookings via a PostgreSQL exclusion constraint, timezone-aware time handling and notification idempotency— and the result is validated with a suite of **320 automated tests** concentrated in the domain and application layers. The work concludes that AI-assisted development, subject to an explicit engineering discipline, is a viable path to produce non-trivial, production-quality software, and transparently documents its limitations and avenues for future evolution.

**Keywords:** multi-tenant SaaS, Clean Architecture, Domain-Driven Design, Test-Driven Development, Next.js, PostgreSQL, Stripe Connect, AI-assisted development, software quality.

---

## Índice general

| # | Capítulo | Contenido |
|---|----------|-----------|
| 1 | **[Introducción y Objetivos](01-introduccion.md)** | Contexto, justificación funcional y metodológica, objetivos, alcance y estructura |
| 2 | **[Estado del Arte y Tecnologías](02-estado-del-arte.md)** | Marco conceptual y justificación razonada de la pila tecnológica frente a alternativas |
| 3 | **[Análisis de Requisitos y Casos de Uso](03-requisitos-casos-uso.md)** | 20 requisitos funcionales trazables, requisitos no funcionales y casos de uso representativos |
| 4 | **[Diseño y Arquitectura](04-diseno-arquitectura.md)** | Las cuatro capas de la Arquitectura Limpia, modelo de persistencia y gestión del estado |
| 5 | **[Implementación](05-implementacion.md)** | Disponibilidad, integridad ante concurrencia, zona horaria, Stripe Connect, *claim-and-release*, RLS |
| 6 | **[Estrategia de Pruebas y Control de Calidad](06-pruebas-calidad.md)** | Pirámide de 320 pruebas, TDD, análisis estático y limitaciones del marco de calidad |
| 7 | **[Conclusiones y Líneas Futuras](07-conclusiones.md)** | Grado de cumplimiento de objetivos, valoración metodológica y trabajo futuro priorizado |
| — | **[Bibliografía](08-bibliografia.md)** | Referencias académicas (IEEE) y documentación técnica consultada |
| — | **[Anexos](09-anexos.md)** | A. Diccionario de datos · B. Políticas RLS · C. Historial de migraciones · D. Variables de entorno · E. Seguridad: OWASP Top 10 y paquete de endurecimiento · F. Estrategia de pruebas y cobertura |

### Detalle de secciones

- **[Cap. 1 · Introducción y Objetivos](01-introduccion.md)** — 1.1 Contexto · 1.2 Justificación · 1.3 Objetivos · 1.4 Alcance · 1.5 Estructura del documento
- **[Cap. 2 · Estado del Arte y Tecnologías](02-estado-del-arte.md)** — 2.1 Panorama de soluciones · 2.2 Marco conceptual · 2.3 Criterios de selección · 2.4 TypeScript · 2.5 Next.js · 2.6 Supabase · 2.7 Stripe Connect · 2.8 Resend · 2.9 Tailwind · 2.10 Vitest · 2.11 Síntesis
- **[Cap. 3 · Requisitos y Casos de Uso](03-requisitos-casos-uso.md)** — 3.1 Introducción · 3.2 Actores · 3.3 Requisitos funcionales · 3.4 Requisitos no funcionales · 3.5 Modelado de casos de uso · 3.6 Especificación (CU-05, CU-08, CU-09)
- **[Cap. 4 · Diseño y Arquitectura](04-diseno-arquitectura.md)** — 4.1 Visión general · 4.2 Dominio · 4.3 Aplicación · 4.4 Infraestructura · 4.5 Presentación · 4.6 Estado · 4.7 Persistencia · 4.8 Síntesis
- **[Cap. 5 · Implementación](05-implementacion.md)** — 5.1 Criterio · 5.2 Disponibilidad · 5.3 Concurrencia · 5.4 Zona horaria · 5.5 Stripe Connect · 5.6 *Claim-and-release* · 5.7 RLS · 5.8 i18n · 5.9 Síntesis
- **[Cap. 6 · Pruebas y Calidad](06-pruebas-calidad.md)** — 6.1 Filosofía · 6.2 Marco · 6.3 Distribución · 6.4 Dominio · 6.5 Aplicación · 6.6 Infraestructura · 6.7 Análisis estático y limitaciones · 6.8 Síntesis
- **[Cap. 7 · Conclusiones](07-conclusiones.md)** — 7.1 Cumplimiento de objetivos · 7.2 Valoración metodológica · 7.3 Limitaciones · 7.4 Líneas futuras · 7.5 Conclusión final

---

## Ficha técnica del proyecto

| | |
|---|---|
| **Producto** | Reservas Chanantes — SaaS *multi-tenant* de reserva de citas |
| **Código fuente** | [`booking-saas/`](../../) (Next.js 16 · React 19 · TypeScript estricto) |
| **Despliegue** | <https://reservas-chanantes.vercel.app/> (Vercel, *serverless*) |
| **Persistencia** | PostgreSQL gestionado por Supabase · 5 tablas · 11 migraciones |
| **Pagos** | Stripe Connect Express (modelo B2B2C) |
| **Pruebas** | 320 casos en 45 ficheros (Vitest); cobertura con umbral, CI y E2E (Playwright) |
| **Arquitectura** | Clean Architecture: `domain` → `application` → `infrastructure` → `presentation` |

---

## Cómo navegar esta memoria

Esta memoria está escrita en **Markdown**, pensada para leerse directamente en el repositorio de Git. Cada capítulo es un fichero independiente y dispone, al pie, de enlaces de navegación **◀ anterior · 🏠 índice · siguiente ▶**. Los diagramas se expresan en **Mermaid** y se renderizan automáticamente en GitHub. Para una lectura secuencial, comience por el **[Capítulo 1](01-introduccion.md)**.

---

<div align="center">

[Comenzar la lectura: Capítulo 1. Introducción y Objetivos ▶](01-introduccion.md)

</div>
