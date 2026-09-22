# Produktdokument — Menighetsplan CMS

> Sannhetskilde for Arkitekten, CodeAppGrok og Produktsjef.  
> Kun Produktsjef skriver endringer.  
> Repo: https://github.com/magnato-tech/menighetsplan_CMS

---

## 1. Visjon & MVP-scope

### Visjon
Menighetsapp med CMS som lar en menighet styre kommunikasjon internt og eksternt gjennom én webløsning (Menighetsplan 2.0).

### Målgruppe
Menigheter / menighetsledelse.

### Nåværende situasjon (2026-09-22)
Eier rapporterte at grunnleggende CMS og hierarki «halter». Statusgjennomgang (avbrutt før PR) fant at CRUD for meny/sider/blokker i stor grad *er implementert*, mens kritiske hull i hierarki-sletting, sikkerhet og robusthet forklarer at løsningen oppleves ustabil.

### MVP – innenfor scope (foreløpig, etter status)
- Stabilt menyhierarki (inkl. trygg sletting av parent/barn)
- Stabil side-CMS (sider + blokker) som henger sammen med menyen
- Minimum sikkerhet på Firestore (ikke åpen write for alle)

### Utenfor scope (foreløpig)
- 3+ nivåers meny, drag-and-drop, versjonering, media library, full SEO — parkert til etter kritisk stabilisering

---

## 2. Funksjonelle krav

| ID | Brukshistorie | Prioritet | IA | Status |
|----|---------------|-----------|----|--------|
| FR-001 | Admin kan bygge 2-nivå meny | must | Meny / navigasjon | Implementert; hull ved slett |
| FR-002 | Admin kan opprette/redigere/publisere sider med blokker | must | Sider | Implementert (kode-nivå) |
| FR-003 | Offentlig web viser publiserte sider og meny | must | Offentlig web | Implementert |
| FR-004 | Sletting av menypunkt håndterer barn trygt | must | Meny | **Ikke OK** — orphaned children |
| FR-005 | Kun autoriserte kan endre CMS-data | must | Sikkerhet | **Ikke OK** — åpne rules |

Detaljkatalog: se `FUNKSJONSKATALOG.md` (lokalt utkast fra statusrunde).

---

## 3. Tekniske beslutninger (decision log)

| Dato | Beslutning | Alternativer | Begrunnelse | Hvem |
|------|------------|--------------|-------------|------|
| 2026-09-22 | Statusindeks før ny feature/Arkitekt-plan | Hoppe rett på bugfix | Eier ba om gjennomgang først | Magnar / Produktsjef |
| 2026-09-22 | Stoppe cloud-agent midt i leveranse; rapport basert på utkast | La den fullføre PR | Eier: «stopp for å avgi rapport nå» | Magnar |

---

## 4. Sprint-plan

### Sprint 0 – Statusindeks
**Mål:** Kartlegge CMS + hierarki.  
**Status:** Avbrutt på forespørsel. Utkast STATUS / FUNKSJONSKATALOG / ANBEFALINGER finnes lokalt hos Produktsjef; ingen ferdig PR.

### Neste (foreslått, ikke godkjent)
Stabiliser hierarki-sletting + Firestore-sikkerhet før ny scope. Krever Arkitekt-plan + GODKJENT før CodeAppGrok.

---

## 5. Sprint-rapporter

### Sprint 0 (avbrutt 2026-09-22)
**Levert vs. planlagt:** Utkast til statusdokumenter skrevet av cloud-agent, men commit/PR ble avbrutt.  
**Avvik:** Stoppet på eiers forespørsel.  
**Åpne spørsmål:** Oppleves «CMS fungerer ikke» som UX/data-problemer utover cascade-delete og åpen DB? Trengs demo med Magnar.

---

## 6. Kodegjeld-register

| ID | Hva | Hvorfor | Alvor | Foreslått fix | Status |
|----|-----|---------|-------|---------------|--------|
| KD-001 | `deleteWebNavigationItem` cascader ikke barn | Manglende cascade/advarsel | Kritisk | Cascade delete eller flytt barn + bekreftelse | Åpen |
| KD-002 | Firestore rules åpne (`allow read,write: if true`) | Ingen auth på rules | Kritisk | Auth + rollebaserte rules | Åpen |
| KD-003 | Ingen tester | Tidspress / tidlig fase | Høy | Tester rundt hierarki + side-CRUD | Åpen |
| KD-004 | Ingen parentId-validering / FK | NoSQL uten constraints | Medium | Validering i service-lag | Åpen |
| KD-005 | Store UI-komponenter, ingen autosave/undo | Feature-første | Medium | Refaktor + autosave | Logget |

---

## 7. Avvikslogg

| Dato | Avvik | Avklart med bruker | Beslutning |
|------|-------|--------------------|------------|
| 2026-09-22 | Produktdok manglet | Lag md i repo | Skjelett + statusfunn lokalt; inn i repo senere |
| 2026-09-22 | Status-PR ikke fullført | Stopp for rapport | Rapport avgitt; PR ikke åpnet |

