# Design Document: Reservas Chanantes — SaaS de Reservas B2B2C

**Proyecto:** `reservas-chanantes`
**Fecha:** 2026-02-20
**Tema:** Diseño Arquitectónico y Flujo de Negocio para el TFM

## Objetivo del Proyecto (TFM)
Desarrollar un sistema de reservas tipo SaaS (B2B2C) donde negocios (peluquerías, fisioterapeutas, etc.) pueden registrarse y permitir a sus clientes realizar reservas de servicios pagando online o en local.
El objetivo fundamental para el Trabajo de Fin de Máster es **demostrar la viabilidad del desarrollo guiado por Inteligencia Artificial priorizando la Máxima Calidad de Software** (Clean Architecture, Testing, TDD, principios SOLID).

## Stack Tecnológico
- **Frontend / Backend:** Next.js (App Router, Server Actions para la capa de Application/Use Cases). Soporte i18n Nativo (es-ES, en-US).
- **Base de Datos / Autenticación:** Supabase (PostgreSQL, Auth, RLS).
- **Pasarela de Pagos:** Stripe (pagos de subscripción SaaS) y Stripe Connect (para que los Tenants cobren a sus clientes).
- **Testing:** Vitest (Unitario/Integración) y Playwright/Cypress (E2E).

## Arquitectura (Clean Architecture Adaptada)
El backend en Next.js se estructurará separando responsabilidades:
- **Domain:** Entidades (`Tenant`, `Service`, `Booking`, `Schedule`) y lógicas de dominio puras independientes de frameworks.
- **Application / Use Cases:** Orquestación (ej: `CreateBookingUseCase`, `CheckAvailabilityUseCase`).
- **Infrastructure:** Repositorios (`SupabaseBookingRepository`) y servicios externos (`StripePaymentService`).
- **Presentation:** Componentes React y Server Actions que actúan como controladores.

## Modelo de Datos Principal (Supabase)
- **Tenants:** Negocios registrados (Id, Nombre, Slug, Moneda_Preferida, Idioma_Por_Defecto).
- **Services:** Catálogo de servicios ofrecidos por un Tenant (Id, TenantId, Nombre_Translatable, Duración, Precio, Moneda).
- **Schedules:** La "parrilla" u horario de apertura general del Tenant.
- **Bookings:** La reserva consolidada (Id, Horario, ServiceId, CustomerId, EstadoPago).
- **Customers:** Usuarios finales que realizan la reserva.

## Flujo de Reserva del Cliente (UI)
Atendiendo al requisito de empezar por la disponibilidad:

1. **Parrilla de Horarios (Grid):** El cliente entra a la URL del local (ej: `/local/peluqueria-juan`). La pantalla principal le muestra una **parrilla de horarios (slots)** directamente, calculando los huecos disponibles basados en el horario de apertura del local menos las reservas ya ocupadas.
2. **Selección de Tipo de Cita / Servicio:** Una vez el cliente clica en un hueco libre (ej: "Jueves 11:00"), se le despliega la opción de **"¿Qué servicio deseas reservar para esta hora?"**.
3. **Validación de Ajuste:** El frontend o backend verifica que el servicio seleccionado "cabe" en el hueco (ej: si seleccionó a las 11:00 y el cierre es 11:30, no puede elegir un servicio de 1 hora).
4. **Checkout:** Se confirma el precio del servicio, se redirecciona a Stripe (si paga online) o se confirma la reserva para pago local.
5. **Confirmación:** La reserva se guarda en base de datos (`Bookings`), bloqueando ese hueco en la parrilla para futuros clientes.

## Testing y Calidad (Foco TFM)
- Fuerte cobertura de tests unitarios en la capa de Casos de Uso y Dominio (especialmente críticos los algoritmos de cálculo de disponibilidad de la parrilla y validación de solapamientos).
- Uso de Inyección de Dependencias para mockear Supabase y Stripe durante los tests.
