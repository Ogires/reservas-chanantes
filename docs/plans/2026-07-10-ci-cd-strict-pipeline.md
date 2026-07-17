# Plan: endurecer CI/CD a pipeline encadenado (deploy solo tras CI verde)

**Fecha:** 2026-07-10 · **Ejecutar en:** sesión limpia · **Estado:** pendiente

> Documento autocontenido. La sesión que lo ejecute no necesita contexto previo.

---

## 1. Estado actual (punto de partida)

- **CI** — GitHub Actions, `booking-saas/.github/workflows/ci.yml`:
  - Job `quality` (push a `main` + PR + manual): `npm ci → lint → tsc --noEmit → vitest --coverage` (umbral 90/90/90/80) `→ next build`.
  - Job `e2e` (solo `workflow_dispatch`): instala Chromium/Firefox/WebKit y corre E2E cross-browser contra el despliegue.
  - `keep-alive.yml`: cron diario que hace `curl` a `/api/health`.
- **CD** — Vercel (integración Git nativa): `push` a `main` → deploy a **producción**; PR → deploy **preview**. `vercel.json` define un cron diario `send-reminders`.
- **Problema a resolver:** CI y CD corren **en paralelo e independientes**. Vercel despliega en cuanto hay push, **sin esperar** a que el job `quality` pase. No es un pipeline encadenado: producción puede recibir código que la CI luego marca como roto.

## 2. Objetivo

**Producción solo se despliega si la CI (`quality`) está verde.** Convertir CI‖CD (paralelo) en **CI → CD** (encadenado).

---

## 3. OPCIÓN A — Deploy desde la CI con Vercel CLI (recomendada: pipeline explícito)

La CI se convierte en el único disparador del deploy: `quality` → (verde) → job `deploy` que publica con la CLI de Vercel. Vercel deja de desplegar por su cuenta.

### A.1 — Vercel (dashboard, una vez)
1. **Desactivar el auto-deploy de producción** para que Vercel NO despliegue solo (si no, habría **deploy doble**). Vía recomendada y reversible:
   - Project → **Settings → Git → Ignored Build Step** → comando: `exit 0`.
   - Efecto: Vercel **omite** cualquier build disparado por Git. Los deploys `--prebuilt` que lanza la CI **no** pasan por ese paso, así que siguen funcionando.
   - *(Verificar el comportamiento en la UI actual de Vercel; el objetivo es: Vercel no construye/despliega producción por su cuenta, solo lo hace el job de CI.)*
   - Alternativa nuclear: **desconectar la integración Git** y hacer TODO (prod + preview) desde la CI.
2. **Obtener credenciales** para la CLI:
   - `VERCEL_TOKEN`: Account → Settings → Tokens → crear token (scope al proyecto si es posible).
   - `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`: ejecutar en local `npx vercel link` y leerlos de `.vercel/project.json`, o cogerlos del dashboard (Project → Settings → General).

### A.2 — GitHub (secrets)
Repo `Ogires/reservas-chanantes` → Settings → Secrets and variables → **Actions → New repository secret**:
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

### A.3 — Nuevo job `deploy` en `ci.yml` (encadenado con `needs`)
Añadir al final de `.github/workflows/ci.yml`:

```yaml
  deploy:
    name: Deploy to production (Vercel)
    needs: [quality]              # ← solo se ejecuta si quality pasa
    if: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}
    runs-on: ubuntu-latest
    env:
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm i -g vercel@latest
      - run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      - run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      - run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

Notas:
- `vercel pull` descarga la config y **las variables de entorno del proyecto** → `vercel build` construye **con env real** (ventaja frente al `next build` del job `quality`, que construye sin env). El job `quality` sigue haciendo su `build` como comprobación; el deploy real lo hace este job.
- El deploy solo ocurre en `push` a `main` (no en PR).

### A.4 — (Opcional) previews de PR desde la CI
Si al desactivar el auto-deploy también se pierden las previews de PR, añadir un job `preview` (`if: github.event_name == 'pull_request'`) idéntico pero con `vercel deploy --prebuilt` (sin `--prod`) y publicar la URL como comentario. Si se mantuvo Git conectado solo para previews, no hace falta.

### A.5 — Riesgos (validación adversarial del plan)
- **Deploy doble** si no se desactiva el auto-deploy de Vercel → paso A.1 es obligatorio; verificar que un push NO dispara dos deploys.
- **`VERCEL_TOKEN`** es un secreto potente → scope mínimo; nunca imprimirlo en logs.
- **Dependencia de la CI para desplegar**: si GitHub Actions cae, no hay deploy automático → mitigación: se puede desplegar a mano con la misma CLI.
- **`vercel build` puede diferir** del `next build` del job quality (usa env real) → comprobar que compila igual.

---

## 4. OPCIÓN B — Branch protection + required check (alternativa, más simple)

Mantiene el auto-deploy de Vercel, pero **protege `main`** para que solo reciba código con CI verde.

### Pasos
1. GitHub → Settings → **Branches → Add branch ruleset** para `main`:
   - ✅ Require a pull request before merging (prohíbe push directo a `main`).
   - ✅ Require status checks to pass → seleccionar el check **`quality`** (aparece tras el primer run).
   - ✅ (opcional) Require branches up to date before merging.
2. Flujo de trabajo: rama de feature → PR → CI `quality` corre + Vercel hace **preview** → *merge* solo si `quality` verde → Vercel despliega a **producción** el merge.

### Trade-offs
- **Pros:** cero secretos, nativo de GitHub, conserva previews de Vercel, bajo riesgo.
- **Contras:** obliga a **flujo de PR** (no más `git push` directo a `main`). El deploy no está "encadenado" en un workflow, pero el **resultado** (producción solo con código CI-verde) se garantiza igual, porque `main` solo admite merges verdes.

---

## 5. DECISIÓN: A + B (fijada 2026-07-10)

Se implementan **ambas**: la protección de rama (B) obliga a PR con `quality` verde antes de mergear, y el deploy encadenado (A) publica producción desde la CI solo tras `quality`. Es la combinación más robusta y la elegida.

### Orden de ejecución (importa)
1. **A.1–A.2** — Vercel: desactivar auto-deploy de producción (Ignored Build Step `exit 0`) + crear los 3 secrets en GitHub (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).
2. **A.3** — Añadir el job `deploy` (`needs: quality`, `if: push && ref==main`). Probarlo **con push directo a main todavía** hasta que despliegue bien y sin doble deploy.
3. **A.4** — Añadir el job `preview` (`if: pull_request`). **Aquí es OBLIGATORIO**, no opcional: con B se trabaja por PR y, al desactivar el auto-deploy de Vercel, se pierden las previews nativas; este job las repone.
4. **B** — Activar branch protection en `main` (require PR + required status check `quality`). **⚠️ HACER ESTO AL FINAL**, cuando (a) el check `quality` ya haya corrido al menos una vez —para poder seleccionarlo en la UI— y (b) A funcione. Si se activa antes, te quedas sin poder mergear y sin flujo de deploy probado.
5. **Verificación** (§6, incluido el test negativo) → **documentación** (§7) → regenerar PDF.

> ⚠️ **Riesgo de auto-bloqueo:** no actives la protección de rama hasta tener A probado. Configura y valida A con push directo primero; B es el último interruptor.

---

## 6. Verificación (tras implementar — imprescindible)

1. **Camino feliz:** push trivial a `main` → job `quality` verde → job `deploy` corre → producción actualizada. Confirmar **un solo** deploy en Vercel (no doble).
2. **La puerta funciona (test negativo):** en una rama, romper un test a propósito → CI `quality` **falla** → el job `deploy` **NO** se ejecuta (`needs: quality`) → producción **NO** cambia. Revertir.
3. (Opción B) Intentar `git push` directo a `main` → **rechazado** por la protección.

---

## 7. Documentación a actualizar (OBLIGATORIO tras implementar)

- [ ] **`docs/memoria/06-pruebas-calidad.md` §6.7**: describir la cadena CI→CD (deploy condicionado a `quality` verde). Hoy solo menciona la CI.
- [ ] **`docs/memoria/07-conclusiones.md`**: si en §7.3/§7.4 figuraba "pipeline no encadenado" como limitación/futuro, marcarlo **resuelto**.
- [ ] **`docs/memoria/09-anexos.md` Anexo D (variables de entorno)**: añadir los secrets de GitHub Actions `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (Opción A).
- [ ] **`README.md`** (sección de despliegue): reflejar que producción se despliega **desde la CI** (o vía PR con check requerido).
- [ ] **`booking-saas/DESPLIEGUE.local.md`** (gitignored): procedimiento operativo nuevo (secrets, cómo desplegar a mano, cómo desactivar el auto-deploy en Vercel).
- [ ] **`docs/memoria/Reservas-Chanantes-TFM-memoria.pdf`**: regenerar con `scratchpad/memoria-pdf/gen-pdf.cjs` (mantener markdown+PDF en sync).
- [ ] Memoria de agente: actualizar `reference_deployment.md` y la nota de CI/CD.

---

## 8. Rollback

- **Opción A:** eliminar el job `deploy`, reactivar el auto-deploy en Vercel (quitar el `exit 0` del Ignored Build Step / reconectar Git), borrar los secrets. Vuelve al estado paralelo actual.
- **Opción B:** eliminar el branch ruleset. Vuelve a permitir push directo a `main`.

---

## 9. Criterio de "hecho"

- Un push con tests rotos **no** llega a producción (verificado con el test negativo).
- Un push verde despliega producción **una sola vez**.
- Documentación (memoria + README + Anexo D + DESPLIEGUE.local) y **PDF regenerado** reflejan el pipeline encadenado.
- `lint/tsc/coverage/build/e2e` y **CI en verde**.
