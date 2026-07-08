# Capítulo 6. Estrategia de Pruebas y Control de Calidad

## 6.1. Filosofía: TDD y la pirámide de pruebas

La calidad del software es, según se argumentó en el Capítulo 1, el eje vertebrador del Trabajo de Fin de Máster. Su materialización más tangible es la **batería de pruebas automatizadas**, concebida bajo dos principios complementarios:

- **Desarrollo guiado por pruebas (*Test-Driven Development*)**: en las capas de dominio y aplicación, la prueba precede a la implementación, de modo que cada regla de negocio nace acompañada de su especificación ejecutable.
- **La pirámide de pruebas**: la mayor densidad de pruebas se concentra en la base —pruebas unitarias rápidas y deterministas sobre el dominio—, disminuyendo a medida que se asciende hacia la infraestructura, más costosa de verificar. Esta forma no es casual: es la consecuencia directa de una Arquitectura Limpia que aísla la lógica de negocio de sus dependencias.

## 6.2. Marco y configuración

El marco de pruebas es **Vitest 4** (`vitest run` para la ejecución única; `vitest` en modo vigilancia). La configuración integra `vite-tsconfig-paths` —que resuelve el alias de módulos `@/*` también en las pruebas— y `@vitejs/plugin-react`. La elección frente a Jest se justificó en el Capítulo 2 por su compatibilidad nativa con ESM y TypeScript. El proyecto define además un script de cobertura (`test:coverage`), si bien, como se discute en la sección 6.7, no se ha fijado un umbral que opere como puerta de calidad automatizada.

## 6.3. Distribución de la batería de pruebas

La suite comprende **209 casos de prueba distribuidos en 25 ficheros**. Su reparto por capas evidencia la pirámide descrita:

| Capa | Ficheros de prueba | Casos | Peso |
|------|--------------------|-------|------|
| **Dominio** | 9 | 115 | 55 % |
| **Aplicación** (casos de uso) | 7 | 57 | 27 % |
| **Infraestructura** | 9 | 37 | 18 % |
| **Total** | **25** | **209** | **100 %** |

> *Tabla 6.1. Distribución de la batería de pruebas por capa arquitectónica.*

El dato relevante no es solo el volumen, sino su **forma**: el 82 % de las pruebas se concentra en las capas de dominio y aplicación —las que albergan las reglas de negocio—, lo que constituye una evidencia objetiva de que la arquitectura ha cumplido su propósito de hacer la lógica crítica verificable de forma aislada y barata.

```mermaid
flowchart TB
    subgraph Pyramid["Pirámide de pruebas (209 casos)"]
        I["Infraestructura — 37 casos (18%)<br/>adaptadores: Supabase, Stripe, Resend, Auth"]
        A["Aplicación — 57 casos (27%)<br/>casos de uso con dobles de prueba"]
        D["Dominio — 115 casos (55%)<br/>objetos de valor y servicios puros"]
    end
    I --- A --- D
```

> *Figura 6.1. La batería de pruebas adopta la forma de pirámide: base ancha en el dominio puro.*

## 6.4. Pruebas de la capa de dominio

El dominio, al carecer de dependencias externas, se presta a una verificación **exhaustiva y determinista**. Los objetos de valor concentran buena parte del esfuerzo: `TimeRange` reúne por sí solo 27 casos que ejercitan sus invariantes (rechazo de rangos inválidos) y su comportamiento (`overlaps`, `contains`, `subtract`). Las pruebas del `availability-calculator` (15 casos) verifican el algoritmo de resta de reservas frente a casos representativos —reserva en el centro de un tramo que lo parte en dos, reservas que dejan el horario completo, encadenamientos—, que son precisamente los escenarios en los que un cálculo ingenuo fallaría.

## 6.5. Pruebas de la capa de aplicación

Los casos de uso se prueban **de forma aislada**, sustituyendo sus colaboradores (repositorios y servicios) por **dobles de prueba** (*test doubles*) que implementan los mismos puertos. Esto es posible, sin artificios, gracias a la **inyección de dependencias por constructor** descrita en el Capítulo 4: `CreateBookingUseCase` recibe cinco repositorios como interfaces y, en las pruebas, se le inyectan implementaciones en memoria.

Dos decisiones de diseño habilitan un determinismo total:

- La inyección del instante actual (`now?: Date`) permite fijar «la hora del sistema» en cada prueba, verificando las fronteras de la **política de antelación** (reserva demasiado pronto, demasiado tarde, en el pasado) sin depender del reloj real.
- La separación de responsabilidades hace que cada una de las **excepciones de dominio** (`TenantNotFoundError`, `BusinessClosedError`, `ServiceDoesNotFitError`, etc.) sea un caso de prueba dirigido y reproducible.

Los 13 casos de `create-booking.test.ts` cubren así tanto el flujo satisfactorio como el conjunto de ramas de error del caso de uso más complejo del sistema.

## 6.6. Pruebas de la capa de infraestructura

En la infraestructura, las pruebas verifican la **correcta traducción entre el mundo externo y el dominio**, no las dependencias de terceros en sí. Son representativos dos casos:

- En `payment-service.test.ts`, se comprueba que el **cálculo de la comisión** en puntos básicos (`amountCents * bps / 10000`) es correcto y que la sesión de pago se construye con los parámetros esperados de Stripe Connect.
- En `booking-repository.test.ts`, se verifica que el código de error `23P01` de PostgreSQL se traduce efectivamente a `SlotTakenError`, garantizando que la frontera de integridad descrita en el Capítulo 5 se comporta como se espera.

## 6.7. Análisis estático y limitaciones del control de calidad

Más allá de las pruebas dinámicas, el control de calidad se apoya en **dos líneas de análisis estático**: el **compilador de TypeScript en modo estricto** (`tsc`), que erradica clases enteras de errores en tiempo de compilación, y **ESLint** con la configuración de Next.js (`eslint-config-next`).

En coherencia con el rigor que guía esta memoria, deben reconocerse las **limitaciones actuales** del aparato de calidad, que el propio análisis de brechas del proyecto identifica:

1. **Ausencia de integración continua (CI/CD)**: no existe un flujo automatizado (`.github/` está ausente) que ejecute `lint`, `tsc` y la batería de pruebas en cada cambio. La verificación es, por tanto, **local y disciplinada**, pero no está institucionalizada en una puerta de calidad.
2. **Ausencia de pruebas *end-to-end* automatizadas**: la suite es de naturaleza unitaria e integración de componentes; las pruebas de extremo a extremo del flujo de reserva se realizaron de forma **manual** (con Playwright como herramienta de inspección), no automatizada, pese a haberse contemplado en el diseño original.
3. **Cobertura no acotada por umbral**: aunque se dispone del script `test:coverage`, no se ha establecido un mínimo de cobertura que falle la construcción si no se alcanza. En el [Anexo F](09-anexos.md) se propone una política de cobertura diferenciada por capa.

Estas tres limitaciones son, no por casualidad, las de mayor retorno académico entre las líneas futuras del Capítulo 7: convertir la calidad **practicada** en calidad **medida y forzada por la herramienta** es el paso natural de evolución del proyecto.

## 6.8. Síntesis

La estrategia de pruebas no es un añadido posterior, sino el reflejo directo de la arquitectura: una pirámide de 209 casos cuya base ancha (82 % en dominio y aplicación) solo es posible porque la lógica de negocio se diseñó desacoplada y comprobable. El análisis estático estricto complementa la verificación dinámica. El capítulo ha expuesto con franqueza las tres carencias del marco de calidad —sin CI, sin E2E automatizado y sin umbral de cobertura—, cuya subsanación se aborda a continuación.

---

[◀ Capítulo 5. Implementación](05-implementacion.md) · [🏠 Índice](README.md) · [Capítulo 7. Conclusiones y Líneas Futuras ▶](07-conclusiones.md)
