# STATUS.md – Menighetsplan CMS: Teknisk Statusgjennomgang

**Dato:** 22. september 2026  
**Repo:** menighetsplan_CMS  
**Formål:** Statusgjennomgang og indeksering av CMS-funksjonalitet og hierarki

---

## 1. Teknologistack

### Frontend
- **Framework:** React 19.0.1 med TypeScript 5.8.2
- **Routing:** React Router DOM 7.18.3
- **Styling:** Tailwind CSS 4.1.14 (Vite-plugin)
- **Animasjoner:** Motion 12.23.24 (Framer Motion)
- **Ikoner:** Lucide React 0.546.0
- **Rich Text Editor:** TipTap 3.31.3 (med StarterKit, Image, Link extensions)
- **Build-tool:** Vite 6.2.3

### Backend & Database
- **Database:** Firebase Firestore 12.19.0 (NoSQL, sanntid)
- **Autentisering:** Ingen implementert (planlagt, ikke aktivt)
- **Security Rules:** `firestore.rules` – åpen for alle (read/write: true)
- **AI-integrasjon:** Google GenAI 2.4.0 (ikke brukt i CMS ennå)

### Deployment
- **Runtime:** Node.js + Bun (lockfile: bun.lock)
- **Dev Server:** Vite dev-server (port 3000, host 0.0.0.0)
- **Produksjon:** Vite build → Express 4.21.2 server (server.js)

---

## 2. Mappe- og modulstruktur

```
menighetsplan_CMS/
├── src/
│   ├── components/         # UI-komponenter
│   │   ├── admin/          # Admin-spesifikke komponenter
│   │   │   ├── AdminMenuBuilder.tsx       # Meny-editor (Pilot 1)
│   │   │   ├── AdminPagesManager.tsx      # Side-editor (Pilot 2)
│   │   │   └── web/
│   │   │       ├── TiptapEditor.tsx       # WYSIWYG-editor
│   │   │       └── CmsPreviewModal.tsx    # Forhåndsvisning
│   │   ├── Header.tsx      # Offentlig navigasjonslinje (leser webNavigation)
│   │   ├── ActionCard.tsx  # Task-kort for medlemmer
│   │   ├── UserSwitcher.tsx # Bytt bruker i testmiljø
│   │   └── ...             # Øvrige komponenter (grupper, chat, etc.)
│   ├── pages/              # Side-komponenter (routes)
│   │   ├── admin/
│   │   │   └── CmsWorkspacePage.tsx  # Fullskjerm CMS Desktop-workspace
│   │   ├── CmsDynamicPageView.tsx    # Generisk renderer for CMS-sider
│   │   ├── AdminPage.tsx   # Admin-oversikt med CMS-faner
│   │   └── ...             # Leder-, gruppe-, samlingsider
│   ├── context/
│   │   └── MockDataContext.tsx  # Global state + Firestore sync
│   ├── hooks/
│   │   ├── useWebNavigation.ts  # Hook for menylogikk + trær
│   │   ├── useWebPages.ts       # Hook for side-CRUD
│   │   └── useAppHooks.ts       # Henter alle domene-data
│   ├── services/
│   │   └── firestoreService.ts  # Firestore CRUD + subscriptions
│   ├── data/
│   │   └── mockData.ts          # Initial seed-data (fallback)
│   ├── types.ts                 # TypeScript domain models
│   ├── firebase.ts              # Firebase init + config
│   ├── App.tsx                  # App-ruter
│   └── main.tsx                 # Entry point
├── assets/                     # Statiske ressurser
├── firestore.rules             # Firebase security rules (åpen)
├── firebase-blueprint.json     # Firestore schema-dokumentasjon
├── .env.example                # Environment template
├── vite.config.ts              # Vite config
├── package.json                # Dependencies
└── bun.lock                    # Package lock
```

### Modulbeskrivelser

#### **`/src/components/admin/`**
Inneholder CMS-spesifikke admin-komponenter:
- **AdminMenuBuilder.tsx** (Pilot 1): To-nivås meny-editor med drag-drop-rekkefølge, synlighet, parent/child-forhold, live preview
- **AdminPagesManager.tsx** (Pilot 2): Side-liste + modal-editor (title, slug, ingress, bodyText, status, blocks)
- **web/TiptapEditor.tsx**: Rich text WYSIWYG (bold, italic, headings, lists, links, images)
- **web/CmsPreviewModal.tsx**: Modal for å forhåndsvise side i mobil/desktop-visning

#### **`/src/pages/admin/CmsWorkspacePage.tsx`**
Fullskjerm CMS workspace (4-kolonner):
1. Modul-ikonstripe (Sider, Meny, Kalender, Bilder, Innstillinger)
2. Navigasjonstre (hierarkisk + søk)
3. Arbeidsflate (editor)
4. Innstillingspanel (høyre sidebar)

#### **`/src/context/MockDataContext.tsx`**
Global React Context som:
- Seeder initial data til Firestore hvis tom
- Abonnerer på Firestore-collections i sanntid
- Eksponerer CRUD-funksjoner til komponenter
- Holder state for personer, grupper, samlinger, tasks, meldinger, CMS-meny, CMS-sider

#### **`/src/services/firestoreService.ts`**
Abstraherer Firestore-operasjoner:
- `subscribeToWebNavigation()` / `subscribeToWebPages()` – real-time listeners
- `saveWebNavigationItemToFirestore()` / `updateWebNavigationItemInFirestore()` – CRUD
- `sanitizeForFirestore()` – fjerner undefined-verdier (Firestore kaster feil på undefined)

#### **`/src/hooks/useWebNavigation.ts`**
Bygger to trær:
- **`tree`**: Komplett hierarki (alle items, synlige + skjulte) – brukes i AdminMenuBuilder
- **`visibleTree`**: Kun synlige items – brukes i public Header

#### **`/src/hooks/useWebPages.ts`**
Filtrerer sider:
- `publishedPages`, `draftPages`, `archivedPages`
- Hjelpefunksjoner for block-håndtering (add/update/remove)

---

## 3. CMS-funksjoner: Status og funn

### 3.1. CMS Pilot 1: Navigasjon & Menyhierarki

**Funksjon:** To-nivås meny-editor (WebNavigationItem)

| **Funksjon** | **Status** | **Detaljer** |
|---|---|---|
| Opprett menypunkt | ✅ **Fungerer** | `createWebNavigationItem()` + Firestore save |
| Rediger menypunkt (label, target, type, parent) | ✅ **Fungerer** | Modal-editor med dropdown for parent-valg |
| Slett menypunkt | ✅ **Fungerer** | Sletter fra Firestore + UI |
| Rekkefølge (opp/ned) | ✅ **Fungerer** | `reorderWebNavigationItem()` justerer `order`-felt |
| Synlighet (vis/skjul) | ✅ **Fungerer** | `toggleWebNavigationVisibility()` + `visible` boolean |
| Parent/child-relasjoner | ⚠️ **Delvis fungerer** | Se "Hierarki-funn" under |
| Koble til CMS-side | ✅ **Fungerer** | Dropdown i editor velger fra `webPages` |
| Live preview av meny | ✅ **Fungerer** | Forhåndsvisning nederst i AdminMenuBuilder |
| Real-time sync | ✅ **Fungerer** | Firestore `onSnapshot()` oppdaterer UI |

**Funn:**
- ✅ To-nivås hierarki implementert korrekt i datamodell (`parentId` refererer til root-items)
- ⚠️ **Ingen validering mot sykliske relasjoner** (kan sette parent = seg selv, men UI prøver å hindre dette)
- ⚠️ **Ingen støtte for tre eller flere nivåer** (designet for 2-nivåer, ekstra nivåer vises ikke)
- ✅ Sortering basert på `order`-felt fungerer

### 3.2. CMS Pilot 2: Sideadministrasjon & Innholdsblokker

**Funksjon:** Dynamiske CMS-sider (WebPage + ContentBlock[])

| **Funksjon** | **Status** | **Detaljer** |
|---|---|---|
| Opprett side (title, slug, status) | ✅ **Fungerer** | Modal-editor + Firestore save |
| Rediger side | ✅ **Fungerer** | 3-faner: Hovedinnhold, Innholdsblokker, Forhåndsvisning |
| Slett side | ✅ **Fungerer** | Slett-knapp med bekreftelsesdialog |
| Publiser/avpubliser (status) | ✅ **Fungerer** | Toggle draft ↔ published |
| Slug-generering | ✅ **Fungerer** | Auto-konverterer tittel til URL-vennlig slug |
| Toppbilde (imageUrl) | ✅ **Fungerer** | URL-input + forhåndsvisning |
| Ingress (kort oppsummering) | ✅ **Fungerer** | Textarea-felt |
| Brødtekst (bodyText) | ✅ **Fungerer** | TipTap WYSIWYG-editor |
| Innholdsblokker (blocks) | ✅ **Fungerer** | Heading, Text, Image, Button, Quote, Gathering |
| Blokk: Heading (h2/h3) | ✅ **Fungerer** | Nivå-velger + tekst-input |
| Blokk: Text | ✅ **Fungerer** | Textarea for avsnitt |
| Blokk: Image | ✅ **Fungerer** | URL + caption |
| Blokk: Button/CTA | ✅ **Fungerer** | Label + target URL |
| Blokk: Quote | ✅ **Fungerer** | Quote text + author |
| Blokk: Gathering | ✅ **Fungerer** | Dropdown velger samling fra `gatherings` |
| Blokk-rekkefølge (opp/ned) | ✅ **Fungerer** | Move-knapper i editor |
| Blokk-sletting | ✅ **Fungerer** | X-knapp på hver blokk |
| Preview modal | ✅ **Fungerer** | Mobil/desktop forhåndsvisning |
| Real-time sync | ✅ **Fungerer** | Firestore `onSnapshot()` oppdaterer UI |
| Koble side til menypunkt | ✅ **Fungerer** | "Legg til i hovedmenyen"-knapp i sidebar |

**Funn:**
- ✅ Alle 6 blokk-typer fungerer
- ✅ Block `order`-felt oppdateres ved rekkefølge-endring
- ⚠️ **TipTap returnerer HTML som string** (lagres i `bodyText` som HTML, ikke Markdown)
- ⚠️ **Ingen media library** – bilder lastes via eksterne URLs (Unsplash, etc.)
- ⚠️ **Ingen SEO-felt** (meta description, OG tags, etc.) – ikke implementert
- ✅ Status-filtering (published/draft/archived) fungerer i UI

### 3.3. CMS Workspace (Fullskjerm Editor)

**Funksjon:** `/admin/web` – 4-kolonners workspace

| **Funksjon** | **Status** | **Detaljer** |
|---|---|---|
| Modul-velger (Sider, Meny, Kalender, Bilder, Innstillinger) | ⚠️ **Delvis** | Kun "Sider" og "Meny" implementert |
| Navigasjonstre (hierarkisk) | ✅ **Fungerer** | Viser meny-hierarki + frittstående sider |
| Søk i sider | ✅ **Fungerer** | Filtrerer på title/slug |
| Status-filter (published/draft) | ✅ **Fungerer** | Quick-filter chips |
| Inline side-editing | ✅ **Fungerer** | Klikk side → rediger i midtpanelet |
| Inline meny-editing | ✅ **Fungerer** | Klikk menypunkt → rediger i midtpanelet |
| Høyre sidebar (innstillinger) | ✅ **Fungerer** | Dynamisk basert på valgt element |
| Ulagrede endringer-varsling | ✅ **Fungerer** | Orange badge + beforeunload-event |
| Ctrl+S / Cmd+S lagring | ✅ **Fungerer** | Keyboard shortcut |
| Live Firestore-indikator | ✅ **Fungerer** | Grønn prikk når tilkoblet |
| Forside-link (glob-ikon) | ✅ **Fungerer** | Hardkodet "Forside" i tre |

**Funn:**
- ⚠️ **Moduler "Kalender", "Bilder", "Innstillinger" er stubber** – knappene finnes, men ingen innhold
- ⚠️ **Ingen autosave** – må klikke "Lagre" manuelt
- ✅ Tree-struktur reflekterer meny-hierarki korrekt
- ⚠️ **Ingen undo/redo** – permanent lagring ved save
- ⚠️ **Ingen versjonering** – siste save overskriver

### 3.4. Offentlig visning (Frontend Rendering)

**Funksjon:** Render CMS-sider på offentlig web

| **Funksjon** | **Status** | **Detaljer** |
|---|---|---|
| Header med navigasjonslinje | ✅ **Fungerer** | Leser `visibleTree` fra `useWebNavigation()` |
| Dropdown-menyer (submenu) | ✅ **Fungerer** | Hover/klikk viser children |
| Dynamisk side-rendering (`/cms/:slug`) | ✅ **Fungerer** | `CmsDynamicPageView.tsx` henter side via `getPageBySlug()` |
| Render heading-blokker | ✅ **Fungerer** | `<h2>` / `<h3>` basert på `headingLevel` |
| Render text-blokker | ✅ **Fungerer** | `<p>` med whitespace-pre-line |
| Render image-blokker | ✅ **Fungerer** | `<img>` + caption |
| Render button-blokker | ✅ **Fungerer** | `<Link to={buttonUrl}>` |
| Render quote-blokker | ✅ **Fungerer** | `<blockquote>` + `<cite>` |
| Render gathering-blokker | ⚠️ **Delvis** | Henter gathering-data, men ingen styling |
| Fallback for manglende side | ✅ **Fungerer** | "Siden finnes ikke"-melding |
| Respekt for `status` (kun published vises) | ✅ **Fungerer** | Filtrering i `getPageBySlug()` |

**Funn:**
- ✅ Rendering fungerer for alle blokk-typer
- ⚠️ **Gathering-blokk mangler visuell styling** (data hentes, men ingen dedikert component)
- ⚠️ **Ingen 404-side** – fallback er OK, men ingen riktig 404-route
- ⚠️ **Ingen SEO meta-tags** – `<head>` har ikke dynamisk title/description per side
- ✅ Bilder har `referrerPolicy="no-referrer"` (for eksterne URLs)

---

## 4. Hierarki: Datamodell, API og UI-funn

### 4.1. Datamodell

**WebNavigationItem schema:**

```typescript
interface WebNavigationItem {
  id: string;
  label: string;           // Menytekst
  parentId?: string | null; // Referanse til parent (null = root)
  order: number;           // Sorteringsrekkefølge (0, 1, 2, ...)
  type: WebNavigationType; // "page" | "gathering" | "article" | "external" | "header"
  target?: string;         // URL/slug (f.eks. "/om-oss/tro")
  visible: boolean;        // Synlig i offentlig meny?
  createdAt: string;
  updatedAt: string;
}
```

**Konklusjon:**
- ✅ **Datamodellen er korrekt designet for 2-nivåers hierarki**
- ✅ `parentId` brukes for å linke barn til forelder
- ✅ `order` styrer rekkefølge innen samme nivå
- ❌ **Ingen støtte for 3+ nivåer** (designvalg, ikke bug)

### 4.2. API / Context-funksjoner

**`createWebNavigationItem()`:**
- ✅ Fungerer – genererer ID, setter timestamps, lagrer til Firestore
- ⚠️ Ingen validering på at `parentId` faktisk eksisterer

**`updateWebNavigationItem()`:**
- ✅ Fungerer – oppdaterer felt i Firestore
- ⚠️ Kan sette `parentId` til ugyldig verdi (ingen foreign key-sjekk)

**`deleteWebNavigationItem()`:**
- ✅ Fungerer – sletter item fra Firestore
- ❌ **KRITISK BUG:** Sletter IKKE barn automatisk hvis man sletter et parent-item
  - **Resultat:** Orphaned children (barn med `parentId` som peker til slettet item)
  - **Anbefaling:** Implementer cascade delete eller warning hvis item har barn

**`reorderWebNavigationItem()`:**
- ✅ Fungerer – bytter `order` med nabo-item
- ✅ Rekkefølgen persisteres i Firestore
- ⚠️ Hvis to items har samme `order`, kan rekkefølgen bli uforutsigbar (sortStable brukes ikke)

**`toggleWebNavigationVisibility()`:**
- ✅ Fungerer – flipper `visible` boolean
- ⚠️ Hvis parent er skjult, vises fortsatt children i `tree` (admin), men ikke i `visibleTree` (public)

### 4.3. UI-funn

**AdminMenuBuilder.tsx:**
- ✅ Viser komplett tre (root + children)
- ✅ Collapse/expand-funksjon for parent-items
- ✅ Inline quick-actions (visibility, reorder, edit, delete)
- ✅ "Legg til undermeny"-knapp på hver parent
- ⚠️ **Ingen visuell indikasjon hvis barn er orphaned** (parentId peker til slettet item)
- ⚠️ **Ingen drag-and-drop** (kun opp/ned-knapper)

**CmsWorkspacePage.tsx:**
- ✅ Viser meny-hierarki i navigasjonstre (venstre sidebar)
- ✅ Viser frittstående sider i separat "Alle CMS-Sider"-gruppe
- ✅ Fargekoding (grønn prikk = published, gul prikk = draft)
- ⚠️ **Ingen indikasjon hvis side er koblet til menypunkt** (må kryss-sjekke manuelt)

**Header.tsx (offentlig):**
- ✅ Rendrer `visibleTree` korrekt
- ✅ Dropdown for children ved hover/klikk
- ⚠️ **Ingen indikasjon hvis menypunkt mangler target** (klikk gjør ingenting)
- ⚠️ **Ingen aria-attributes** (accessibility kan forbedres)

### 4.4. Konkrete hierarki-problemer (hypoteser)

| **Problem** | **Hypotese** | **Alvorlighetsgrad** |
|---|---|---|
| **Orphaned children etter delete** | `deleteWebNavigationItem()` sletter ikke barn-items når parent slettes | 🔴 **Høy** – data-integritet |
| **Ingen validering av parentId** | Kan opprette item med `parentId` som ikke finnes | 🟡 **Middels** – data-kvalitet |
| **Manglende cascade-logikk** | Ingen automatisk opprydding av relasjoner | 🟡 **Middels** – teknisk gjeld |
| **Ingen foreign key constraints** | Firestore har ingen relasjonelle constraints (NoSQL) | 🟢 **Lav** – designvalg, må håndteres i app-logikk |
| **Ingen 3+ nivåer støtte** | `useWebNavigation()` bygger kun 2-nivåers tre | 🟢 **Lav** – bevisst designvalg |
| **Samme order-verdi mulig** | Ingen unique constraint på `order` per nivå | 🟡 **Middels** – kan gi ustabil sortering |
| **Ingen undo på hierarki-endringer** | Permanent lagring uten versjonering | 🟡 **Middels** – brukeropplevelse |

---

## 5. Kjente risikoer og teknisk gjeld

### 5.1. Sikkerhet
- 🔴 **Firestore rules er åpne** (`allow read, write: if true`) – INGEN autentisering/autorisering
  - **Risiko:** Hvem som helst kan lese/skrive/slette alle data
  - **Anbefaling:** Implementer Firebase Authentication + rolle-baserte regler
- 🟡 **Ingen input-validering** – manglende sanitering av bruker-input (XSS-risiko i HTML-felt)
- 🟡 **Ingen rate limiting** – kan spamme Firestore med requests

### 5.2. Data-integritet
- 🔴 **Orphaned children ved delete** (se hierarki-funn)
- 🟡 **Ingen foreign key constraints** (kan lage menyitem med ugyldig `parentId`)
- 🟡 **Ingen unique slug constraint** – kan opprette flere sider med samme slug (siste vinner)
- 🟡 **Undefined-verdier ikke sanitert konsekvent** (noen steder kan det kræsje)

### 5.3. Brukeropplevelse
- 🟡 **Ingen autosave** – man kan miste endringer ved crash/lukking
- 🟡 **Ingen undo/redo** – permanent lagring
- 🟡 **Ingen versjonering** – kan ikke gjenopprette gammel versjon av side
- 🟡 **Ingen media library** – må kopiere eksterne URLs manuelt
- 🟢 **Ingen draft preview på faktisk URL** – draft-sider vises ikke på `/slug` (kun i editor)

### 5.4. Ytelse
- 🟢 **Real-time listeners kan skalere dårlig** – ved 1000+ sider/menypunkter, kan `onSnapshot()` bli tregt
- 🟢 **Ingen paginering** – alle sider/menypunkter lastes samtidig (OK for små datasett)
- 🟢 **Ingen caching** – hver side-load henter fra Firestore (men real-time er ønsket oppførsel)

### 5.5. Teknisk gjeld
- 🟡 **Ingen tester** – verken unit-, integrasjons- eller e2e-tester
- 🟡 **Ingen TypeScript strict mode** – `tsconfig.json` har ikke `strict: true`
- 🟡 **Mange store komponenter** (>2000 linjer i `CmsWorkspacePage.tsx`, >1200 i `AdminMenuBuilder.tsx`)
- 🟡 **Ingen error boundaries** – React-feil kan kræsje hele appen
- 🟢 **Ingen logging/monitoring** – vanskelig å debugge produksjonsproblemer

---

## 6. Manglende funksjoner (ikke implementert)

### 6.1. CMS-funksjoner
- ❌ SEO-felt (meta title, description, OG tags)
- ❌ Media library (bildeupplastning + håndtering)
- ❌ Revisjonhistorikk / versjonering
- ❌ Draft preview på live URL
- ❌ Planlagt publisering (scheduled publishing)
- ❌ Bulk-operasjoner (masseendring av status, etc.)
- ❌ Søk på offentlig web (kun i admin)
- ❌ Brødsmulesti (breadcrumbs) på sider

### 6.2. Hierarki-funksjoner
- ❌ Drag-and-drop reordering (kun opp/ned-knapper)
- ❌ 3+ nivåers meny (kun 2 nivåer)
- ❌ Meny-preview i mobil-visning (kun desktop)
- ❌ Automatisk breadcrumbs fra hierarki

### 6.3. Autentisering & autorisasjon
- ❌ Firebase Authentication (login/logout)
- ❌ Rolle-basert tilgangskontroll (admin vs editor vs viewer)
- ❌ Firestore security rules (alle kan lese/skrive)

### 6.4. Testing & kvalitet
- ❌ Unit-tester (Jest / Vitest)
- ❌ Integrasjonstester
- ❌ E2E-tester (Playwright / Cypress)
- ❌ TypeScript strict mode
- ❌ Linting CI/CD (ESLint kjører ikke automatisk)

---

## 7. Oppsummering: Hva fungerer vs. hva er ødelagt

### ✅ **Fungerer bra:**
1. **CMS Pilot 1 (Meny):** Opprett/rediger/slett/reorder/synlighet av menypunkter
2. **CMS Pilot 2 (Sider):** Opprett/rediger/slett/publiser sider med innholdsblokker
3. **Hierarki (2 nivåer):** Parent/child-relasjoner i datamodell og UI
4. **Real-time sync:** Firestore `onSnapshot()` oppdaterer UI automatisk
5. **CMS Workspace:** Fullskjerm 4-kolonners editor med navigasjonstre
6. **Offentlig rendering:** Dynamiske sider vises korrekt på web
7. **TipTap WYSIWYG:** Rich text editor fungerer som forventet

### ⚠️ **Delvis fungerer / mangler polish:**
1. **Hierarki-validering:** Ingen sjekk på ugyldige `parentId`-referanser
2. **Gathering-blokk rendering:** Data hentes, men ingen dedikert styling
3. **Moduler i Workspace:** Kun "Sider" og "Meny" fungerer, resten er stubber
4. **SEO:** Ingen meta-tags, OG-tags, eller structured data

### 🔴 **Ødelagt / kritiske problemer:**
1. **Orphaned children:** `deleteWebNavigationItem()` sletter ikke barn automatisk
2. **Åpen Firestore:** Security rules tillater alle operasjoner uten autentisering
3. **Ingen tester:** Ingen automatisk kvalitetssikring

---

## 8. Konklusjon

**Menighetsplan CMS er i en MVP-tilstand:**
- ✅ Grunnleggende CMS-funksjonalitet (meny + sider) **fungerer**
- ⚠️ Hierarki-logikk **fungerer** for normale use-cases, men mangler robusthet (cascade delete, validering)
- 🔴 **Kritisk sikkerhetshull** i Firestore (åpne regler)
- 🟡 **Teknisk gjeld** i form av store komponenter, manglende tester, ingen autosave

**Generelt vurdering:**
- **Data-modellen er solid** (korrekt design for 2-nivåers hierarki)
- **UI/UX er godt gjennomført** (intuitiv, polert design)
- **Implementasjonen mangler robusthet** (feilhåndtering, validering, cascade-logikk)
- **Produksjonsklarhet:** ❌ Ikke klar (krever autentisering + sikkerhet + testing)

---

**Neste steg:** Se `FUNKSJONSKATALOG.md` for detaljert funksjonsindeks og prioriterte anbefalinger.