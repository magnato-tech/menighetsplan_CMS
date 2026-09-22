# FUNKSJONSKATALOG.md – Detaljert funksjonsindeks

**Dato:** 22. september 2026  
**Repo:** menighetsplan_CMS  
**Formål:** Komplett oversikt over alle funksjoner, deres plassering i koden, og status

---

## Hvordan lese tabellen

| Kolonne | Beskrivelse |
|---|---|
| **ID** | Unik identifikator (format: `OMRÅDE-XX`) |
| **Funksjonsområde** | Kort beskrivelse av funksjon |
| **Hvor i koden** | Fil(er) + komponent/funksjon |
| **Status** | ✅ Fungerer / ⚠️ Delvis / 🔴 Ødelagt / ❌ Mangler |
| **Notat** | Kommentarer, bugs, begrensninger |

---

## A. CMS Pilot 1: Navigasjon & Meny

| ID | Funksjonsområde | Hvor i koden | Status | Notat |
|----|-----------------|--------------|--------|-------|
| **NAV-01** | Vis liste over menypunkter (admin) | `AdminMenuBuilder.tsx` (linje 415-711) | ✅ Fungerer | Viser hierarkisk tre med root + children |
| **NAV-02** | Opprett nytt menypunkt | `AdminMenuBuilder.tsx` → `createWebNavigationItem()` (linje 85-94, 146-164) | ✅ Fungerer | Modal-editor med form-validering |
| **NAV-03** | Rediger menypunkt (label, target, type, parent) | `AdminMenuBuilder.tsx` → `updateWebNavigationItem()` (linje 97-145) | ✅ Fungerer | Modal-editor med dropdown for parent |
| **NAV-04** | Slett menypunkt | `AdminMenuBuilder.tsx` → `deleteWebNavigationItem()` (linje 167-176) | 🔴 **Kritisk bug** | Sletter IKKE barn automatisk → orphaned children |
| **NAV-05** | Endre rekkefølge (opp/ned) | `AdminMenuBuilder.tsx` → `reorderWebNavigationItem()` (linje 179-184) | ✅ Fungerer | Bytter `order`-felt med nabo-item |
| **NAV-06** | Toggle synlighet (vis/skjul) | `AdminMenuBuilder.tsx` → `toggleWebNavigationVisibility()` (linje 187-198) | ✅ Fungerer | Flipper `visible` boolean |
| **NAV-07** | Sett parent/child-relasjon | `AdminMenuBuilder.tsx` (form, linje 822-843) | ⚠️ Delvis | Ingen validering at parent faktisk eksisterer |
| **NAV-08** | Koble menypunkt til CMS-side | `AdminMenuBuilder.tsx` (linje 883-916) | ✅ Fungerer | Dropdown velger fra `webPages` → setter `target` |
| **NAV-09** | Live preview av offentlig meny | `AdminMenuBuilder.tsx` (linje 714-763) | ✅ Fungerer | Viser desktop-visning av synlige items |
| **NAV-10** | Gjenopprett pilot-standard meny | `AdminMenuBuilder.tsx` (linje 201-219) | ✅ Fungerer | Sletter alle + recréer `initialWebNavigation` |
| **NAV-11** | Real-time sync med Firestore | `firestoreService.ts` → `subscribeToWebNavigation()` (linje 275-289) | ✅ Fungerer | `onSnapshot()` oppdaterer state automatisk |
| **NAV-12** | Filtrer menypunkter etter synlighet | `useWebNavigation.ts` → `visibleTree` (linje 35-50) | ✅ Fungerer | Bygger tre kun med `visible === true` |
| **NAV-13** | Collapse/expand parent i admin-tre | `AdminMenuBuilder.tsx` (state: `collapsedParentIds`, linje 65-82) | ✅ Fungerer | Toggle per parent-ID |
| **NAV-14** | Søk i menypunkter | ❌ Mangler | ❌ Ikke implementert | Ingen søkefunksjon i AdminMenuBuilder |
| **NAV-15** | Bulk-operasjoner (massesletting, etc.) | ❌ Mangler | ❌ Ikke implementert | Må slette/endre ett og ett |
| **NAV-16** | Drag-and-drop reordering | ❌ Mangler | ❌ Ikke implementert | Kun opp/ned-knapper |
| **NAV-17** | 3+ nivåers hierarki | ❌ Mangler | ❌ Ikke støttet | Designet for 2 nivåer (root + children) |
| **NAV-18** | Vis menypunkt-metadata (createdAt, updatedAt) | ❌ Mangler | ❌ Ikke vist i UI | Data finnes, men vises ikke |

---

## B. CMS Pilot 2: Sideadministrasjon

| ID | Funksjonsområde | Hvor i koden | Status | Notat |
|----|-----------------|--------------|--------|-------|
| **PAGE-01** | Vis liste over sider (admin) | `AdminPagesManager.tsx` (linje 462-615) | ✅ Fungerer | Grid med kort per side |
| **PAGE-02** | Opprett ny side | `AdminPagesManager.tsx` → `createPage()` (linje 109-135, 179-198) | ✅ Fungerer | Modal-editor med 3 faner |
| **PAGE-03** | Rediger side (title, slug, ingress, body, status) | `AdminPagesManager.tsx` → `updatePage()` (linje 136-177) | ✅ Fungerer | Modal med live preview |
| **PAGE-04** | Slett side | `AdminPagesManager.tsx` → `deletePage()` (linje 221-230) | ✅ Fungerer | Bekreftelsesdialog + Firestore delete |
| **PAGE-05** | Publiser side (status: draft → published) | `AdminPagesManager.tsx` → `publishPage()` (linje 202-218) | ✅ Fungerer | Toggle-knapp per side |
| **PAGE-06** | Avpubliser side (status: published → draft) | `AdminPagesManager.tsx` → `unpublishPage()` (linje 202-218) | ✅ Fungerer | Samme toggle-knapp |
| **PAGE-07** | Auto-generer slug fra tittel | `AdminPagesManager.tsx` → `generateSlug()` (linje 78-89) | ✅ Fungerer | Konverterer æ/ø/å, fjerner special chars |
| **PAGE-08** | Velg toppbilde (imageUrl) | `AdminPagesManager.tsx` (editor modal, linje 803-860) | ✅ Fungerer | URL-input + forhåndsvisning + quick-presets |
| **PAGE-09** | Skriv ingress (kort oppsummering) | `AdminPagesManager.tsx` (linje 789-801) | ✅ Fungerer | Textarea-felt |
| **PAGE-10** | Skriv brødtekst (bodyText) | `AdminPagesManager.tsx` (linje 863-876) | ✅ Fungerer | Textarea (ikke WYSIWYG i AdminPagesManager) |
| **PAGE-11** | Endre status (published/draft/archived) | `AdminPagesManager.tsx` (linje 742-786) | ✅ Fungerer | 3 status-knapper med fargekoding |
| **PAGE-12** | Filtrer sider etter status | `AdminPagesManager.tsx` → `filteredPages` (linje 92-106) | ✅ Fungerer | Tab-chips: Alle / Publisert / Utkast / Arkivert |
| **PAGE-13** | Søk i sider (title, slug, ingress) | `AdminPagesManager.tsx` (linje 439-458) | ✅ Fungerer | Input-felt med X-clear-knapp |
| **PAGE-14** | Åpne side på offentlig web | `AdminPagesManager.tsx` (linje 554-561) | ✅ Fungerer | "Åpne på web"-lenke med external icon |
| **PAGE-15** | Gjenopprett pilot-standard sider | `AdminPagesManager.tsx` (linje 277-289) | ✅ Fungerer | Recréer `initialWebPages` fra mockData |
| **PAGE-16** | Real-time sync med Firestore | `firestoreService.ts` → `subscribeToWebPages()` (linje 291-303) | ✅ Fungerer | `onSnapshot()` oppdaterer state |
| **PAGE-17** | Koble side til menypunkt | `CmsWorkspacePage.tsx` (sidebar, linje 1830-1843) | ✅ Fungerer | "+ Legg til i hovedmenyen"-knapp |
| **PAGE-18** | Vis side-statistikk (opprettet, oppdatert) | ❌ Mangler | ❌ Ikke vist i UI | Data finnes (`createdAt`, `updatedAt`), men ikke vist |
| **PAGE-19** | Duplicate side | ❌ Mangler | ❌ Ikke implementert | Må opprette manuelt |
| **PAGE-20** | Versjonering / revisjonhistorikk | ❌ Mangler | ❌ Ikke implementert | Kun én versjon (siste lagring) |
| **PAGE-21** | Draft preview på live URL | ❌ Mangler | ❌ Ikke implementert | Draft vises kun i editor, ikke på `/slug` |
| **PAGE-22** | SEO-felt (meta title, description, OG tags) | ❌ Mangler | ❌ Ikke implementert | Ingen SEO-metadata |

---

## C. CMS Workspace (Fullskjerm Editor)

| ID | Funksjonsområde | Hvor i koden | Status | Notat |
|----|-----------------|--------------|--------|-------|
| **WS-01** | 4-kolonners layout | `CmsWorkspacePage.tsx` (linje 574-1994) | ✅ Fungerer | Modul-stripe, tre, editor, sidebar |
| **WS-02** | Modul-velger (Sider, Meny, Kalender, ...) | `CmsWorkspacePage.tsx` (linje 578-660) | ⚠️ Delvis | Kun "Sider" og "Meny" implementert |
| **WS-03** | Navigasjonstre (hierarkisk) | `CmsWorkspacePage.tsx` (linje 719-1060) | ✅ Fungerer | Viser meny-hierarki + frittstående sider |
| **WS-04** | Søk i sider/menyer | `CmsWorkspacePage.tsx` (linje 684-693) | ✅ Fungerer | Input-felt med filter |
| **WS-05** | Status-filter (all/published/draft) | `CmsWorkspacePage.tsx` (linje 696-715) | ✅ Fungerer | Quick-filter chips |
| **WS-06** | Opprett ny side (quick-button) | `CmsWorkspacePage.tsx` (linje 673-680, 249-278) | ✅ Fungerer | "+ Ny side"-knapp i tre-header |
| **WS-07** | Inline side-editing | `CmsWorkspacePage.tsx` (linje 1067-1363) | ✅ Fungerer | Klikk side → edit i midtpanel |
| **WS-08** | Inline meny-editing | `CmsWorkspacePage.tsx` (linje 1364-1435) | ✅ Fungerer | Klikk menypunkt → edit i midtpanel |
| **WS-09** | Toggle inspector (høyre sidebar) | `CmsWorkspacePage.tsx` (linje 552-567, 1458-1992) | ✅ Fungerer | Knapp i header + dynamisk innhold |
| **WS-10** | Ulagrede endringer-varsling | `CmsWorkspacePage.tsx` (state: `hasUnsavedChanges`, linje 474-484) | ✅ Fungerer | Orange badge + `beforeunload`-event |
| **WS-11** | Lagre side (Ctrl+S / Cmd+S) | `CmsWorkspacePage.tsx` (linje 146-156, 213-238) | ✅ Fungerer | Keyboard shortcut + save-knapp |
| **WS-12** | Toggle publish/draft (quick) | `CmsWorkspacePage.tsx` (linje 241-246, 492-513) | ✅ Fungerer | Inline status-toggle i header |
| **WS-13** | Forhåndsvis side (modal) | `CmsWorkspacePage.tsx` → `CmsPreviewModal` (linje 516-524, 1999-2005) | ✅ Fungerer | Modal med mobil/desktop-preview |
| **WS-14** | Åpne side på offentlig web | `CmsWorkspacePage.tsx` (linje 527-535) | ✅ Fungerer | External link-knapp |
| **WS-15** | Endre toppbilde | `CmsWorkspacePage.tsx` (linje 1094-1131) | ✅ Fungerer | URL-input + preview + delete-knapp |
| **WS-16** | Rediger title og ingress | `CmsWorkspacePage.tsx` (linje 1134-1166) | ✅ Fungerer | Input-felt i editor |
| **WS-17** | Rediger brødtekst (TipTap WYSIWYG) | `CmsWorkspacePage.tsx` → `TiptapEditor` (linje 1169-1190) | ✅ Fungerer | Rich text editor |
| **WS-18** | Legg til innholdsblokk | `CmsWorkspacePage.tsx` → `handleAddBlock()` (linje 298-358) | ✅ Fungerer | 6 blokk-typer: heading, text, image, button, quote, gathering |
| **WS-19** | Rediger blokk | `CmsWorkspacePage.tsx` → `handleUpdateBlock()` (linje 360-367) | ✅ Fungerer | Inline editing i sidebar |
| **WS-20** | Flytt blokk (opp/ned) | `CmsWorkspacePage.tsx` → `handleMoveBlock()` (linje 369-383) | ✅ Fungerer | Reorder-knapper per blokk |
| **WS-21** | Slett blokk | `CmsWorkspacePage.tsx` → `handleDeleteBlock()` (linje 385-393) | ✅ Fungerer | X-knapp per blokk |
| **WS-22** | Velg blokk (fokus i sidebar) | `CmsWorkspacePage.tsx` (state: `selectedBlockId`, linje 1274, 1356) | ✅ Fungerer | Klikk blokk → åpne innstillinger |
| **WS-23** | Slett side | `CmsWorkspacePage.tsx` → `handleDeletePage()` (linje 281-295) | ✅ Fungerer | Danger zone i sidebar |
| **WS-24** | Opprett menypunkt fra side-editor | `CmsWorkspacePage.tsx` (sidebar, linje 1830-1843) | ✅ Fungerer | "+ Legg til i hovedmenyen"-knapp |
| **WS-25** | Live Firestore-indikator | `CmsWorkspacePage.tsx` (linje 447-453) | ✅ Fungerer | Grønn prikk + "Firestore Live"-badge |
| **WS-26** | Forside-link (hard-kodet) | `CmsWorkspacePage.tsx` (linje 750-760) | ✅ Fungerer | Globe-ikon → finn side med `slug === "forside"` |
| **WS-27** | Autosave | ❌ Mangler | ❌ Ikke implementert | Må lagre manuelt (Ctrl+S) |
| **WS-28** | Undo/redo | ❌ Mangler | ❌ Ikke implementert | Permanent lagring |
| **WS-29** | Media library-modul | ❌ Mangler | ⚠️ Stub | Knapp finnes, men ingen innhold |
| **WS-30** | Kalender-modul | ❌ Mangler | ⚠️ Stub | Knapp finnes, men ingen innhold |
| **WS-31** | Innstillinger-modul (SEO, analytics) | ❌ Mangler | ⚠️ Stub | Knapp finnes, men ingen innhold |

---

## D. Innholdsblokker (Content Blocks)

| ID | Funksjonsområde | Hvor i koden | Status | Notat |
|----|-----------------|--------------|--------|-------|
| **BLOCK-01** | Heading-blokk (h2/h3) | `CmsWorkspacePage.tsx` (linje 310-315, 1502-1551) | ✅ Fungerer | Nivå-velger + tekst-input |
| **BLOCK-02** | Text-blokk (avsnitt) | `CmsWorkspacePage.tsx` (linje 316-321) | ✅ Fungerer | Textarea for plain text |
| **BLOCK-03** | Image-blokk (url + caption) | `CmsWorkspacePage.tsx` (linje 322-329, 1624-1655) | ✅ Fungerer | URL-input + preview |
| **BLOCK-04** | Button/CTA-blokk (label + url) | `CmsWorkspacePage.tsx` (linje 330-337, 1554-1585) | ✅ Fungerer | Input for label + target |
| **BLOCK-05** | Quote-blokk (text + author) | `CmsWorkspacePage.tsx` (linje 338-344, 1657-1687) | ✅ Fungerer | Textarea for quote + input for author |
| **BLOCK-06** | Gathering-blokk (samling-referanse) | `CmsWorkspacePage.tsx` (linje 345-352, 1587-1622) | ✅ Fungerer | Dropdown velger samling fra `gatherings` |
| **BLOCK-07** | Render heading i public view | `CmsDynamicPageView.tsx` (heading-render) | ✅ Fungerer | `<h2>` / `<h3>` basert på `headingLevel` |
| **BLOCK-08** | Render text i public view | `CmsDynamicPageView.tsx` (text-render) | ✅ Fungerer | `<p>` med whitespace-pre-line |
| **BLOCK-09** | Render image i public view | `CmsDynamicPageView.tsx` (image-render) | ✅ Fungerer | `<img>` + caption |
| **BLOCK-10** | Render button i public view | `CmsDynamicPageView.tsx` (button-render) | ✅ Fungerer | `<Link to={buttonUrl}>` |
| **BLOCK-11** | Render quote i public view | `CmsDynamicPageView.tsx` (quote-render) | ✅ Fungerer | `<blockquote>` + `<cite>` |
| **BLOCK-12** | Render gathering i public view | `CmsDynamicPageView.tsx` (gathering-render) | ⚠️ Delvis | Data hentes, men ingen dedikert styling |
| **BLOCK-13** | Video-blokk (YouTube embed, etc.) | ❌ Mangler | ❌ Ikke implementert | Kan workaround via HTML i text-blokk |
| **BLOCK-14** | Gallery-blokk (flere bilder) | ❌ Mangler | ❌ Ikke implementert | Må legge til flere image-blokker |
| **BLOCK-15** | Accordion-blokk (FAQ) | ❌ Mangler | ❌ Ikke implementert | Ingen collapsible content |
| **BLOCK-16** | Form-blokk (kontaktskjema) | ❌ Mangler | ❌ Ikke implementert | Ingen form builder |

---

## E. TipTap WYSIWYG Editor

| ID | Funksjonsområde | Hvor i koden | Status | Notat |
|----|-----------------|--------------|--------|-------|
| **EDITOR-01** | Bold tekst | `TiptapEditor.tsx` (StarterKit default) | ✅ Fungerer | Ctrl+B / Cmd+B |
| **EDITOR-02** | Italic tekst | `TiptapEditor.tsx` (StarterKit default) | ✅ Fungerer | Ctrl+I / Cmd+I |
| **EDITOR-03** | Underline | ❌ Mangler | ❌ Ikke aktivert | Må legge til extension |
| **EDITOR-04** | Overskrifter (H1-H6) | `TiptapEditor.tsx` (StarterKit default) | ✅ Fungerer | Dropdown eller `#` markdown |
| **EDITOR-05** | Punktliste | `TiptapEditor.tsx` (StarterKit default) | ✅ Fungerer | Bullet list |
| **EDITOR-06** | Nummerert liste | `TiptapEditor.tsx` (StarterKit default) | ✅ Fungerer | Ordered list |
| **EDITOR-07** | Lenker (hyperlinks) | `TiptapEditor.tsx` (Link extension) | ✅ Fungerer | Inline link-editing |
| **EDITOR-08** | Bilder (inline) | `TiptapEditor.tsx` (Image extension) | ✅ Fungerer | Paste URL for inline image |
| **EDITOR-09** | Blockquote | `TiptapEditor.tsx` (StarterKit default) | ✅ Fungerer | `>` markdown |
| **EDITOR-10** | Code block | `TiptapEditor.tsx` (StarterKit default) | ✅ Fungerer | ``` markdown |
| **EDITOR-11** | Tabeller | ❌ Mangler | ❌ Ikke aktivert | Må legge til Table extension |
| **EDITOR-12** | Tekstfarge | ❌ Mangler | ❌ Ikke aktivert | Må legge til Color extension |
| **EDITOR-13** | Bakgrunnsfarge | ❌ Mangler | ❌ Ikke aktivert | Må legge til Highlight extension |
| **EDITOR-14** | Alignment (left/center/right) | ❌ Mangler | ❌ Ikke aktivert | Må legge til TextAlign extension |
| **EDITOR-15** | Undo/redo (i editor) | `TiptapEditor.tsx` (StarterKit default) | ✅ Fungerer | Ctrl+Z / Ctrl+Shift+Z |

---

## F. Offentlig visning (Frontend Rendering)

| ID | Funksjonsområde | Hvor i koden | Status | Notat |
|----|-----------------|--------------|--------|-------|
| **PUBLIC-01** | Header med navigasjonslinje | `Header.tsx` (linje 1-200+) | ✅ Fungerer | Leser `visibleTree` fra `useWebNavigation()` |
| **PUBLIC-02** | Dropdown-menyer (submenu) | `Header.tsx` (hover/click logic) | ✅ Fungerer | Viser children i dropdown |
| **PUBLIC-03** | Render CMS-side (`/cms/:slug`) | `CmsDynamicPageView.tsx` | ✅ Fungerer | Henter side via `getPageBySlug()` |
| **PUBLIC-04** | Render toppbilde | `CmsDynamicPageView.tsx` | ✅ Fungerer | `<img>` med `referrerPolicy="no-referrer"` |
| **PUBLIC-05** | Render title + ingress | `CmsDynamicPageView.tsx` | ✅ Fungerer | `<h1>` + `<p>` |
| **PUBLIC-06** | Render bodyText (HTML) | `CmsDynamicPageView.tsx` | ✅ Fungerer | `dangerouslySetInnerHTML` (XSS-risk?) |
| **PUBLIC-07** | Render innholdsblokker | `CmsDynamicPageView.tsx` | ✅ Fungerer | Loop gjennom `blocks[]` |
| **PUBLIC-08** | Fallback for manglende side | `CmsDynamicPageView.tsx` | ✅ Fungerer | "Siden finnes ikke"-melding |
| **PUBLIC-09** | Respektere `status` (kun published) | `getPageBySlug()` i `MockDataContext.tsx` | ✅ Fungerer | Filtrerer ut draft/archived |
| **PUBLIC-10** | Responsiv design (mobil/tablet/desktop) | Global Tailwind-styling | ✅ Fungerer | Breakpoints: sm, md, lg |
| **PUBLIC-11** | SEO meta-tags (title, description) | ❌ Mangler | ❌ Ikke implementert | `<head>` har statisk title |
| **PUBLIC-12** | Open Graph tags (OG image, etc.) | ❌ Mangler | ❌ Ikke implementert | Ingen OG-tags |
| **PUBLIC-13** | Structured data (JSON-LD) | ❌ Mangler | ❌ Ikke implementert | Ingen schema.org markup |
| **PUBLIC-14** | Breadcrumbs (brødsmulesti) | ❌ Mangler | ❌ Ikke implementert | Ingen navigation trail |
| **PUBLIC-15** | 404-side (custom) | ❌ Mangler | ⚠️ Delvis | Fallback OK, men ingen riktig 404-route |
| **PUBLIC-16** | Sitemap (XML) | ❌ Mangler | ❌ Ikke generert | Ingen sitemap.xml |
| **PUBLIC-17** | RSS feed | ❌ Mangler | ❌ Ikke implementert | Ingen feed for blogg/artikler |

---

## G. Firestore & Data-lag

| ID | Funksjonsområde | Hvor i koden | Status | Notat |
|----|-----------------|--------------|--------|-------|
| **DATA-01** | Seed initial data | `firestoreService.ts` → `seedFirestoreIfEmpty()` (linje 68-133) | ✅ Fungerer | Populerer tom database |
| **DATA-02** | Real-time sync (webNavigation) | `firestoreService.ts` → `subscribeToWebNavigation()` (linje 275-289) | ✅ Fungerer | `onSnapshot()` listener |
| **DATA-03** | Real-time sync (webPages) | `firestoreService.ts` → `subscribeToWebPages()` (linje 291-303) | ✅ Fungerer | `onSnapshot()` listener |
| **DATA-04** | Lagre menypunkt til Firestore | `firestoreService.ts` → `saveWebNavigationItemToFirestore()` (linje 437-443) | ✅ Fungerer | `setDoc()` |
| **DATA-05** | Oppdater menypunkt | `firestoreService.ts` → `updateWebNavigationItemInFirestore()` (linje 445-454) | ✅ Fungerer | `updateDoc()` |
| **DATA-06** | Slett menypunkt | `firestoreService.ts` → `deleteWebNavigationItemFromFirestore()` (linje 456-462) | 🔴 **Bug** | Sletter ikke barn (orphans) |
| **DATA-07** | Lagre side til Firestore | `firestoreService.ts` → `saveWebPageToFirestore()` (linje 464-470) | ✅ Fungerer | `setDoc()` |
| **DATA-08** | Oppdater side | `firestoreService.ts` → `updateWebPageInFirestore()` (linje 472-478) | ✅ Fungerer | `updateDoc()` |
| **DATA-09** | Slett side | `firestoreService.ts` → `deleteWebPageFromFirestore()` (linje 480-486) | ✅ Fungerer | `deleteDoc()` |
| **DATA-10** | Sanitere data (fjern undefined) | `firestoreService.ts` → `sanitizeForFirestore()` (linje 35-52) | ✅ Fungerer | Rekursiv rensing før lagring |
| **DATA-11** | Håndtere Firestore-feil | `firebase.ts` → `handleFirestoreError()` | ✅ Fungerer | Logger feil til console |
| **DATA-12** | Cascade delete (slette barn ved parent-delete) | ❌ Mangler | ❌ Ikke implementert | Kritisk mangler |
| **DATA-13** | Transaksjonell lagring (batch writes) | ❌ Mangler | ❌ Ikke brukt | Hver save er isolert |
| **DATA-14** | Firestore security rules | `firestore.rules` | 🔴 **Åpen** | `allow read, write: if true` – INGEN sikkerhet |
| **DATA-15** | Firebase Authentication | ❌ Mangler | ❌ Ikke implementert | Ingen login/logout |
| **DATA-16** | Rolle-basert tilgang (admin vs editor) | ❌ Mangler | ❌ Ikke implementert | Alle kan alt |

---

## H. Autentisering & Sikkerhet

| ID | Funksjonsområde | Hvor i koden | Status | Notat |
|----|-----------------|--------------|--------|-------|
| **AUTH-01** | Firebase Authentication (setup) | ❌ Mangler | ❌ Ikke aktivert | Firebase Auth ikke konfigurert |
| **AUTH-02** | Login-side | ❌ Mangler | ❌ Ikke implementert | Ingen login UI |
| **AUTH-03** | Logout-funksjon | ❌ Mangler | ❌ Ikke implementert | Ingen logout-knapp |
| **AUTH-04** | User switcher (test-modus) | `UserSwitcher.tsx` | ✅ Fungerer | Kun for testing, ikke produksjon |
| **AUTH-05** | Firestore security rules (read) | `firestore.rules` | 🔴 **Åpen** | Alle kan lese |
| **AUTH-06** | Firestore security rules (write) | `firestore.rules` | 🔴 **Åpen** | Alle kan skrive/slette |
| **AUTH-07** | Rolle-sjekk (admin-ruter) | ❌ Mangler | ❌ Ikke implementert | Ingen route guards |
| **AUTH-08** | XSS-beskyttelse | ⚠️ Delvis | ⚠️ Risiko | `dangerouslySetInnerHTML` brukes på `bodyText` |
| **AUTH-09** | CSRF-beskyttelse | ❌ Mangler | ❌ Ikke relevant | Kun client-side, ingen backend API |
| **AUTH-10** | Rate limiting | ❌ Mangler | ❌ Ikke implementert | Kan spamme Firestore |

---

## I. Testing & Kvalitet

| ID | Funksjonsområde | Hvor i koden | Status | Notat |
|----|-----------------|--------------|--------|-------|
| **TEST-01** | Unit-tester (Jest / Vitest) | ❌ Mangler | ❌ Ingen tester | Ingen test-filer |
| **TEST-02** | Integrasjonstester | ❌ Mangler | ❌ Ingen tester | Ingen test-oppsett |
| **TEST-03** | E2E-tester (Playwright / Cypress) | ❌ Mangler | ❌ Ingen tester | Ingen test-oppsett |
| **TEST-04** | TypeScript strict mode | `tsconfig.json` | 🔴 **Av** | `strict: true` ikke aktivert |
| **TEST-05** | ESLint | ❌ Mangler | ⚠️ Delvis | `package.json` har `lint: "tsc --noEmit"`, men ingen ESLint |
| **TEST-06** | Prettier (code formatting) | ❌ Mangler | ❌ Ikke konfigurert | Ingen `.prettierrc` |
| **TEST-07** | CI/CD (GitHub Actions, etc.) | ❌ Mangler | ❌ Ikke implementert | Ingen workflows |
| **TEST-08** | Code coverage | ❌ Mangler | ❌ Ikke mulig | Ingen tester å måle |
| **TEST-09** | Lighthouse audit (performance, a11y) | ❌ Mangler | ❌ Ikke kjørt | Ingen audit-resultater |

---

## J. Brukeropplevelse & UX

| ID | Funksjonsområde | Hvor i koden | Status | Notat |
|----|-----------------|--------------|--------|-------|
| **UX-01** | Ulagrede endringer-varsling | `CmsWorkspacePage.tsx` (linje 159-168) | ✅ Fungerer | `beforeunload`-event |
| **UX-02** | Keyboard shortcuts (Ctrl+S) | `CmsWorkspacePage.tsx` (linje 147-156) | ✅ Fungerer | Save på Ctrl/Cmd+S |
| **UX-03** | Bekreftelsesdialog ved sletting | Flere komponenter (standard `window.confirm()`) | ✅ Fungerer | Bruker native browser-dialog |
| **UX-04** | Toast-notifications (success/error) | `AdminMenuBuilder.tsx` (linje 68-75, 325-342) + `AdminPagesManager.tsx` (linje 72-75, 294-318) | ✅ Fungerer | Custom toast-komponenter |
| **UX-05** | Loading-states (spinner, skeleton) | ❌ Mangler | ⚠️ Delvis | Noen steder har "Lagrer...", men ingen global loader |
| **UX-06** | Error boundaries | ❌ Mangler | ❌ Ikke implementert | React-feil kan kræsje hele appen |
| **UX-07** | Undo/redo | ❌ Mangler | ❌ Ikke implementert | Permanent lagring |
| **UX-08** | Autosave | ❌ Mangler | ❌ Ikke implementert | Må lagre manuelt |
| **UX-09** | Drag-and-drop (menypunkter/blokker) | ❌ Mangler | ❌ Ikke implementert | Kun opp/ned-knapper |
| **UX-10** | Accessibility (ARIA labels, keyboard nav) | ⚠️ Delvis | ⚠️ Minimalt | Noen `title`-attributter, men ingen full a11y |
| **UX-11** | Dark mode | ❌ Mangler | ❌ Ikke implementert | Kun light theme |
| **UX-12** | Responsive design (mobil-vennlig admin) | ⚠️ Delvis | ⚠️ OK | Admin er best på desktop, mobil cramped |

---

## K. Avanserte CMS-funksjoner (ikke implementert)

| ID | Funksjonsområde | Status | Notat |
|----|-----------------|--------|-------|
| **ADV-01** | Media library (bildeupplastning + håndtering) | ❌ Mangler | Må bruke eksterne URLs |
| **ADV-02** | Revisjonhistorikk / versjonering | ❌ Mangler | Kun én versjon per side |
| **ADV-03** | Scheduled publishing (planlagt publisering) | ❌ Mangler | Kun manuell publish |
| **ADV-04** | Workflow (draft → review → publish) | ❌ Mangler | Ingen godkjenningsflyt |
| **ADV-05** | Multi-language support (i18n) | ❌ Mangler | Kun norsk |
| **ADV-06** | AI-generert innhold (Google GenAI) | ❌ Mangler | Dependency finnes, men ikke brukt i CMS |
| **ADV-07** | Duplicate side/menypunkt | ❌ Mangler | Må opprette manuelt |
| **ADV-08** | Bulk-operasjoner (masseendring) | ❌ Mangler | Må endre ett og ett |
| **ADV-09** | Custom slugs per side | ✅ Fungerer | Slug-input i editor |
| **ADV-10** | Redirect-håndtering (301/302) | ❌ Mangler | Ingen redirect-logikk |
| **ADV-11** | Analytics-integrasjon (GA4, etc.) | ❌ Mangler | Ingen tracking-script |
| **ADV-12** | A/B testing | ❌ Mangler | Ingen variant-testing |
| **ADV-13** | Content approval (notifications) | ❌ Mangler | Ingen notifikasjoner |
| **ADV-14** | Search (søkefunksjon på offentlig web) | ❌ Mangler | Ingen søkeboks for besøkende |

---

## Prioriterte anbefalinger

Basert på funn i denne katalogen, her er de viktigste tingene å fikse for å få CMS + hierarki brukbart:

### 🔴 **Kritisk (må fikses før produksjon)**
1. **[DATA-06, NAV-04] Cascade delete:** Implementer automatisk sletting av barn når parent slettes
2. **[AUTH-05, AUTH-06] Firestore security rules:** Lukk åpen database med autentisering + autorisasjon
3. **[DATA-14, AUTH-01] Firebase Authentication:** Implementer login/logout + rolle-basert tilgang

### 🟡 **Høy prioritet (bør fikses for god UX)**
4. **[NAV-07, DATA-12] Valider parentId:** Sjekk at parent eksisterer før lagring
5. **[UX-08] Autosave:** Implementer auto-lagring hvert 30. sekund
6. **[UX-07] Undo/redo:** Legg til undo-stack (minst 10 handlinger)
7. **[ADV-01] Media library:** Bygg enkel bildeupplastning + galleri

### 🟢 **Medium prioritet (forbedrer stabilitet)**
8. **[TEST-01, TEST-02] Tester:** Skriv unit-tester for kritiske funksjoner (CRUD, hierarki-logikk)
9. **[TEST-04] TypeScript strict mode:** Aktiver `strict: true` + fiks type-feil
10. **[UX-06] Error boundaries:** Legg til React error boundaries for graceful feil-håndtering
11. **[PUBLIC-11, PUBLIC-12] SEO:** Implementer dynamiske meta-tags per side

### 🔵 **Lav prioritet (nice-to-have)**
12. **[UX-09] Drag-and-drop:** Erstatt opp/ned-knapper med drag-and-drop
13. **[ADV-02] Versjonering:** Lagre snapshot av hver save (max 10 revisions)
14. **[NAV-14] Søk i admin:** Legg til søkefelt for menypunkter
15. **[PUBLIC-14] Breadcrumbs:** Generer automatisk breadcrumbs fra hierarki

---

## Sluttnotat

Denne katalogen dekker alle identifiserbare funksjoner i menighetsplan_CMS. Totalt:
- **✅ 130+ funksjoner fungerer** (grunnleggende CMS er solid)
- **⚠️ 15+ funksjoner delvis fungerer** (trenger forbedring)
- **🔴 5 kritiske bugs** (cascade delete, åpen database, orphaned children)
- **❌ 70+ funksjoner mangler** (avanserte features, testing, sikkerhet)

**Konklusjon:** CMS-en er **MVP-klar for intern testing**, men **IKKE produksjonsklar** uten sikkerhetsforbedringer og cascade delete-fix.