# ANBEFALINGER.md – Prioritert handlingsplan

**Dato:** 22. september 2026  
**Repo:** menighetsplan_CMS  
**Formål:** Konkrete anbefalinger for hva som bør fikses først

---

## Oppsummering av status

Menighetsplan CMS har **solid grunnleggende funksjonalitet** for meny- og sideadministrasjon, men mangler **sikkerhet, robusthet og testing** for å være produksjonsklar.

**Hovedfunn:**
- ✅ Grunnleggende CMS fungerer (meny + sider + innholdsblokker)
- ⚠️ Hierarki-logikk fungerer, men mangler validering og cascade delete
- 🔴 Kritisk sikkerhetshull: Firestore er åpen for alle (ingen autentisering)
- 🔴 Data-integritetsrisiko: Orphaned children ved sletting av parent-items
- 🟡 Teknisk gjeld: Store komponenter, manglende tester, ingen autosave

---

## Prioritert handlingsplan

### 🔴 **KRITISK (må fikses før produksjon)**

#### 1. Lukk Firestore-databasen (sikkerhet)
**Problem:** `firestore.rules` har `allow read, write: if true` – hvem som helst kan lese/skrive/slette data.

**Løsning:**
1. Implementer Firebase Authentication (email/passord eller Google Sign-In)
2. Oppdater `firestore.rules` til å kreve autentisering:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Kun autentiserte brukere kan lese
       match /{document=**} {
         allow read: if request.auth != null;
       }
       
       // Kun admins kan skrive til CMS-collections
       match /webNavigation/{itemId} {
         allow write: if request.auth != null && 
                        get(/databases/$(database)/documents/persons/$(request.auth.uid)).data.globalRole == "admin";
       }
       
       match /webPages/{pageId} {
         allow write: if request.auth != null && 
                        get(/databases/$(database)/documents/persons/$(request.auth.uid)).data.globalRole == "admin";
       }
     }
   }
   ```
3. Legg til login-side og beskyttet routing (f.eks. med `ProtectedRoute` wrapper)

**Estimat:** 2-3 dagers arbeid (implementasjon + testing)

---

#### 2. Implementer cascade delete for hierarki
**Problem:** Sletting av parent-menypunkt etterlater orphaned children (barn med `parentId` som peker til slettet item).

**Løsning:**
1. I `deleteWebNavigationItem()` (i `MockDataContext.tsx`):
   ```typescript
   const deleteWebNavigationItem = async (id: string) => {
     // Finn alle barn av dette item
     const children = webNavigation.filter(item => item.parentId === id);
     
     if (children.length > 0) {
       // Enten: Slett barna også (cascade)
       for (const child of children) {
         await deleteWebNavigationItemFromFirestore(child.id);
       }
       
       // Eller: Flytt barna til root-nivå (set parentId = null)
       // for (const child of children) {
       //   await updateWebNavigationItemInFirestore(child.id, { parentId: null });
       // }
     }
     
     // Deretter slett parent
     await deleteWebNavigationItemFromFirestore(id);
     return { success: true };
   };
   ```

2. Legg til bekreftelsesdialog som viser antall barn:
   ```typescript
   const confirmMessage = children.length > 0
     ? `Dette menypunktet har ${children.length} underpunkter. Alle vil bli slettet. Fortsette?`
     : `Er du sikker på at du vil slette dette menypunktet?`;
   
   if (!window.confirm(confirmMessage)) return;
   ```

**Estimat:** 0.5 dags arbeid (implementasjon + testing)

---

#### 3. Valider parentId ved opprettelse/redigering
**Problem:** Kan sette `parentId` til en ID som ikke eksisterer, eller til seg selv (syklisk referanse).

**Løsning:**
1. I `createWebNavigationItem()` og `updateWebNavigationItem()`:
   ```typescript
   // Sjekk at parentId eksisterer (hvis satt)
   if (data.parentId) {
     const parentExists = webNavigation.some(item => item.id === data.parentId);
     if (!parentExists) {
       return { success: false, error: "Ugyldig parent-ID: parent finnes ikke" };
     }
   }
   
   // Hvis update: sjekk ikke syklisk (parent = self)
   if (editingItem && data.parentId === editingItem.id) {
     return { success: false, error: "Et menypunkt kan ikke være sin egen parent" };
   }
   ```

**Estimat:** 0.5 dags arbeid (implementasjon + testing)

---

### 🟡 **HØY PRIORITET (bør fikses for god UX)**

#### 4. Implementer autosave i CMS Workspace
**Problem:** Brukeren må huske å trykke "Lagre" manuelt, kan miste endringer ved crash/lukking.

**Løsning:**
1. Legg til debounced autosave (trigger 2 sekunder etter siste endring):
   ```typescript
   useEffect(() => {
     if (!hasUnsavedChanges || !editingPage) return;
     
     const timeoutId = setTimeout(() => {
       handleSaveCurrentPage();
       console.log("✅ Autosaved");
     }, 2000); // 2 sekunder debounce
     
     return () => clearTimeout(timeoutId);
   }, [editingPage, hasUnsavedChanges]);
   ```

2. Vis "Lagrer..."-indikator når autosave kjører
3. Hold fortsatt "Lagre"-knappen for manuell save

**Estimat:** 1 dags arbeid (implementasjon + testing)

---

#### 5. Legg til undo/redo-funksjonalitet
**Problem:** Permanent lagring uten mulighet til å angre endringer.

**Løsning:**
1. Implementer undo-stack (array av tidligere tilstander):
   ```typescript
   const [undoStack, setUndoStack] = useState<WebPage[]>([]);
   const [redoStack, setRedoStack] = useState<WebPage[]>([]);
   
   const pushToUndoStack = (page: WebPage) => {
     setUndoStack(prev => [...prev, page].slice(-10)); // Max 10 history
     setRedoStack([]); // Clear redo when new edit
   };
   
   const handleUndo = () => {
     if (undoStack.length === 0) return;
     const previous = undoStack[undoStack.length - 1];
     setRedoStack(prev => [...prev, editingPage!]);
     setEditingPage(previous);
     setUndoStack(prev => prev.slice(0, -1));
   };
   ```

2. Legg til Ctrl+Z / Cmd+Z keyboard shortcut
3. Legg til undo/redo-knapper i toolbar

**Estimat:** 1-2 dagers arbeid (implementasjon + testing)

---

#### 6. Bygg enkel media library
**Problem:** Bilder må lastes via eksterne URLs (Unsplash, etc.), ingen opplasting.

**Løsning:**
1. Bruk Firebase Storage for bildeupplasting:
   ```typescript
   import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
   import { storage } from "./firebase";
   
   const uploadImage = async (file: File) => {
     const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
     await uploadBytes(storageRef, file);
     const url = await getDownloadURL(storageRef);
     return url;
   };
   ```

2. Lag `MediaLibrary`-komponent:
   - Grid med opplastede bilder
   - Drag-and-drop upload
   - Klikk for å kopiere URL
   - Søk/filter etter filnavn

3. Integrer i CMS Workspace som "Bilder"-modul

**Estimat:** 2-3 dagers arbeid (UI + Firebase Storage setup)

---

### 🟢 **MEDIUM PRIORITET (forbedrer stabilitet)**

#### 7. Skriv unit-tester for kritiske funksjoner
**Problem:** Ingen tester – vanskelig å oppdage regression bugs.

**Løsning:**
1. Sett opp Vitest (eller Jest):
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom
   ```

2. Skriv tester for hierarki-logikk:
   ```typescript
   // useWebNavigation.test.ts
   test("tree builder creates correct parent-child structure", () => {
     const items = [
       { id: "1", label: "Parent", parentId: null, order: 0 },
       { id: "2", label: "Child", parentId: "1", order: 0 },
     ];
     const tree = buildTree(items);
     expect(tree[0].children).toHaveLength(1);
     expect(tree[0].children[0].id).toBe("2");
   });
   
   test("cascade delete removes children", async () => {
     const result = await deleteWebNavigationItem("parent-id");
     expect(result.success).toBe(true);
     // Check children are also deleted
   });
   ```

3. Test CRUD-operasjoner (create, update, delete for pages + nav items)
4. Test edge cases (sykliske relasjoner, ugyldige IDs)

**Estimat:** 3-5 dagers arbeid (oppsett + dekningsgrad 50%+)

---

#### 8. Aktiver TypeScript strict mode
**Problem:** `tsconfig.json` har ikke `strict: true`, kan skjule type-feil.

**Løsning:**
1. Oppdater `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true,
       "strictFunctionTypes": true
     }
   }
   ```

2. Fiks alle type-feil som dukker opp (estimert 20-50 steder)
3. Legg til explicit types for alle funksjoner:
   ```typescript
   // Før:
   const createPage = async (data) => { ... }
   
   // Etter:
   const createPage = async (data: CreatePageInput): Promise<CreatePageResult> => { ... }
   ```

**Estimat:** 1-2 dagers arbeid (fiks alle type-feil)

---

#### 9. Legg til React error boundaries
**Problem:** React-feil kan kræsje hele appen (hvit skjerm).

**Løsning:**
1. Lag `ErrorBoundary`-komponent:
   ```typescript
   class ErrorBoundary extends React.Component {
     state = { hasError: false };
     
     static getDerivedStateFromError() {
       return { hasError: true };
     }
     
     componentDidCatch(error, errorInfo) {
       console.error("React error:", error, errorInfo);
     }
     
     render() {
       if (this.state.hasError) {
         return <div>Noe gikk galt. <button onClick={() => window.location.reload()}>Last inn på nytt</button></div>;
       }
       return this.props.children;
     }
   }
   ```

2. Wrap kritiske komponenter:
   ```typescript
   <ErrorBoundary>
     <CmsWorkspacePage />
   </ErrorBoundary>
   ```

**Estimat:** 0.5 dags arbeid (implementasjon)

---

#### 10. Implementer SEO-felt (meta tags)
**Problem:** Ingen dynamiske meta-tags per side (dårlig for SEO).

**Løsning:**
1. Legg til SEO-felt i `WebPage`-type:
   ```typescript
   interface WebPage {
     // ... existing fields
     seoTitle?: string;
     seoDescription?: string;
     ogImage?: string;
   }
   ```

2. Legg til SEO-tab i editor (side om Hovedinnhold, Innholdsblokker, **SEO**)
3. I `CmsDynamicPageView.tsx`, sett dynamisk `<head>`:
   ```typescript
   useEffect(() => {
     document.title = page.seoTitle || page.title;
     
     // Meta description
     const metaDesc = document.querySelector('meta[name="description"]');
     if (metaDesc) {
       metaDesc.setAttribute("content", page.seoDescription || page.ingress || "");
     }
     
     // OG tags
     // ...
   }, [page]);
   ```

**Estimat:** 1-2 dagers arbeid (UI + rendering)

---

### 🔵 **LAV PRIORITET (nice-to-have)**

#### 11. Erstatt opp/ned-knapper med drag-and-drop
**Hvorfor:** Bedre UX for reordering av menypunkter og innholdsblokker.

**Løsning:**
- Bruk bibliotek som `@dnd-kit/core` eller `react-beautiful-dnd`
- Implementer drag-and-drop i `AdminMenuBuilder.tsx` og blokk-liste i `CmsWorkspacePage.tsx`

**Estimat:** 2-3 dagers arbeid

---

#### 12. Implementer versjonering (revisjonhistorikk)
**Hvorfor:** Kan gjenopprette gammel versjon av side hvis noe går galt.

**Løsning:**
- Lag ny Firestore-collection `webPageRevisions`
- Lagre snapshot ved hver save (max 10 revisions per side)
- UI for å browse + gjenopprette revisions

**Estimat:** 3-4 dagers arbeid

---

#### 13. Legg til søk i admin (menypunkter)
**Hvorfor:** Lettere å finne items i store menyer.

**Løsning:**
- Søkefelt i `AdminMenuBuilder.tsx` (allerede finnes i `AdminPagesManager.tsx`)
- Filtrer `tree` basert på søkequery

**Estimat:** 0.5 dags arbeid

---

#### 14. Generer automatisk breadcrumbs fra hierarki
**Hvorfor:** Forbedrer navigasjon på offentlig web.

**Løsning:**
- I `CmsDynamicPageView.tsx`, finn side i meny-tre
- Bygg sti fra root til current page
- Render som `Hjem > Om oss > Vår tro`

**Estimat:** 1 dags arbeid

---

## Konklusjon

**Minimum for MVP produksjonsklar:**
1. ✅ Lukk Firestore-databasen (auth + security rules) – **3 dager**
2. ✅ Cascade delete for hierarki – **0.5 dag**
3. ✅ Valider parentId – **0.5 dag**

**Total MVP-tid:** ~4 dager

**For god brukeropplevelse, legg til:**
4. Autosave – **1 dag**
5. Undo/redo – **2 dager**
6. Media library – **3 dager**

**Total "god UX"-tid:** +6 dager = **10 dager totalt**

**For produksjonsklarhet med testing:**
7. Unit-tester – **5 dager**
8. TypeScript strict – **2 dager**
9. Error boundaries – **0.5 dag**
10. SEO-felt – **2 dager**

**Total produksjonsklarhet:** +9.5 dager = **19.5 dager totalt**

---

**Anbefalt prioritering:**
1. **Uke 1:** Kritisk (sikkerhet + cascade delete) – 4 dager
2. **Uke 2:** Høy prioritet (autosave, undo, media library) – 6 dager
3. **Uke 3-4:** Medium prioritet (testing, types, SEO) – 9.5 dager

**Etter 4 uker:** CMS er produksjonsklar med god kvalitet og stabilitet.