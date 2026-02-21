# Enterprise Demo — Flutningslýsing

Þetta skjal inniheldur allar upplýsingar sem þarf til að flytja **Enterprise Demo CRM kerfið** úr þessu verkefni (`c:\GitHub\Cursor`) yfir í nýtt sjálfstætt Cursor verkefni.

---

## 1. Um verkefnið

- **Nafn:** Enterprise Demo
- **Tegund:** CRM (Customer Relationship Management) kerfi
- **Byggt á:** Raunverulegu þjónustuframboði Enterprise Leiga (enterpriseleiga.is)
- **Virkni:** Stjórnun viðskiptavina, bíla, samninga, sölutækifæra, málaskráningar, verkefna og þjónustuáminninga
- **Núverandi slóð:** `http://localhost:3000/verkefni/enterprice-demo`
- **Tungumál:** UI á íslensku, kóði/breytuheiti á ensku

---

## 2. Tæknistakkur

| Tækni | Útgáfa | Notkun |
|-------|--------|--------|
| Next.js (App Router) | ^14.2.0 | Framework |
| React | ^18.3.0 | UI library |
| TypeScript | ^5.3.0 | Tegundaöryggi |
| Tailwind CSS | ^3.4.0 | Stílar |
| Supabase SSR + JS | ^0.8.0 / ^2.97.0 | Auth og gagnagrunnur |
| @dnd-kit/core + sortable | ^6.3.1 / ^10.0.0 | Drag-and-drop (dashboard widgets) |
| recharts | ^3.7.0 | Gröf og myndir |
| nodemailer | ^8.0.1 | Tölvupóstsending (SMTP) |
| xlsx (devDep) | ^0.18.5 | Excel útflutningur |

---

## 3. Uppsetning nýs verkefnis

### 3.1 Stofna verkefni

```bash
npx create-next-app@14 enterprise-demo --typescript --tailwind --eslint --app --src-dir=false
cd enterprise-demo
```

### 3.2 Setja upp dependencies

```bash
npm install @supabase/ssr@^0.8.0 @supabase/supabase-js@^2.97.0 @supabase/auth-js@^2.97.0 @dnd-kit/core@^6.3.1 @dnd-kit/sortable@^10.0.0 @dnd-kit/utilities@^3.2.2 nodemailer@^8.0.1 recharts@^3.7.0
npm install -D @types/nodemailer@^7.0.10 xlsx@^0.18.5
```

### 3.3 Stilla .env.local

Búa til `.env.local` í rót nýja verkefnisins:

```env
# Supabase — stofna eigið project á supabase.com eða nota sama
NEXT_PUBLIC_SUPABASE_URL=https://[THITT-PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# SMTP (valfrjálst — ef sleppt virkar email í mock-ham)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=password
SMTP_FROM_NAME=Enterprise Demo
```

### 3.4 Gagnagrunnur (Supabase SQL)

CRM gögnin eru öll mock data í `lib/enterprise-demo-data.ts` — enginn gagnagrunnur þarf fyrir CRM hlutann.

Supabase er aðeins notað fyrir **auth** (notendainnskráning) og **user_profiles** (nafn á dashboard).

Ef þú vilt auth, keyrðu þessar SQL skrár í Supabase SQL Editor:
- `docs/database-admin.sql` — Býr til `admin_users`, `user_profiles`, `user_logins`, `tool_usage`
- `docs/setup-admin.sql` — Gerir ákveðinn notanda að admin

---

## 4. Skráalisti — Allar skrár sem þarf að afrita

### 4.1 Config skrár (afrita í rót)

| Upprunaleg skrá | Afrita sem | Athugasemd |
|------------------|------------|------------|
| `next.config.js` | `next.config.js` | Yfirskrifa — leyfir myndir frá placehold.co |
| `tailwind.config.ts` | `tailwind.config.ts` | Yfirskrifa — sérstakir litir og leturgerðir |
| `middleware.ts` | `middleware.ts` | Yfirskrifa — Supabase auth middleware |
| `tsconfig.json` | `tsconfig.json` | Staðfesta `@/*` path alias er til staðar |
| `postcss.config.js` | `postcss.config.js` | Sjálfgefið — líklega þegar til |
| `.eslintrc.json` | `.eslintrc.json` | `"extends": "next/core-web-vitals"` |

### 4.2 Globals CSS (sameina)

| Upprunaleg skrá | Afrita sem | Athugasemd |
|------------------|------------|------------|
| `app/globals.css` línur 291–500 | Bæta við `app/globals.css` | Enterprise theme CSS (dark/light) |
| `app/globals.css` línur 186–227 | Bæta við `app/globals.css` | Animations (fade-in-up, fade-in, slide-in-right) |

### 4.3 Lib skrár (afrita í `lib/`)

| Upprunaleg skrá | Afrita sem |
|------------------|------------|
| `lib/enterprise-demo-data.ts` | `lib/enterprise-demo-data.ts` |
| `lib/verkefni-store.ts` | `lib/verkefni-store.ts` |
| `lib/dashboard-preferences.ts` | `lib/dashboard-preferences.ts` |
| `lib/supabase-browser.ts` | `lib/supabase-browser.ts` |
| `lib/supabase.ts` | `lib/supabase.ts` |
| `lib/supabase-server.ts` | `lib/supabase-server.ts` |
| `lib/supabase-middleware.ts` | `lib/supabase-middleware.ts` |
| `lib/email.ts` | `lib/email.ts` |

### 4.4 Components (afrita í `components/`)

| Upprunaleg skrá | Afrita sem |
|------------------|------------|
| `components/enterprise-theme-provider.tsx` | `components/enterprise-theme-provider.tsx` |
| `components/BilPanel.tsx` | `components/BilPanel.tsx` |
| `components/NyBilModal.tsx` | `components/NyBilModal.tsx` |
| `components/TengilidurPanel.tsx` | `components/TengilidurPanel.tsx` |
| `components/FinnaTaekifaeriPanel.tsx` | `components/FinnaTaekifaeriPanel.tsx` |
| `components/MalModal.tsx` | `components/MalModal.tsx` |
| `components/NyttVerkefniModal.tsx` | `components/NyttVerkefniModal.tsx` |
| `components/VerkefniDetailModal.tsx` | `components/VerkefniDetailModal.tsx` |
| `components/ImageLightbox.tsx` | `components/ImageLightbox.tsx` |
| `components/dashboard/DashboardWidget.tsx` | `components/dashboard/DashboardWidget.tsx` |
| `components/dashboard/DashboardCustomizer.tsx` | `components/dashboard/DashboardCustomizer.tsx` |

### 4.5 Síður (afrita og endurnefna leiðir)

Færa úr `app/verkefni/enterprice-demo/` í `app/` (rót) í nýja verkefninu:

| Upprunaleg skrá | Afrita sem |
|------------------|------------|
| `app/verkefni/enterprice-demo/layout.tsx` | `app/layout.tsx` eða `app/(dashboard)/layout.tsx` |
| `app/verkefni/enterprice-demo/page.tsx` | `app/page.tsx` eða `app/(dashboard)/page.tsx` |
| `app/verkefni/enterprice-demo/bilar/page.tsx` | `app/bilar/page.tsx` |
| `app/verkefni/enterprice-demo/bilar/[id]/page.tsx` | `app/bilar/[id]/page.tsx` |
| `app/verkefni/enterprice-demo/vidskiptavinir/page.tsx` | `app/vidskiptavinir/page.tsx` |
| `app/verkefni/enterprice-demo/vidskiptavinir/[id]/page.tsx` | `app/vidskiptavinir/[id]/page.tsx` |
| `app/verkefni/enterprice-demo/tengilidir/page.tsx` | `app/tengilidir/page.tsx` |
| `app/verkefni/enterprice-demo/solutaekifaeri/page.tsx` | `app/solutaekifaeri/page.tsx` |
| `app/verkefni/enterprice-demo/samningar/page.tsx` | `app/samningar/page.tsx` |
| `app/verkefni/enterprice-demo/verkefnalisti/page.tsx` | `app/verkefnalisti/page.tsx` |
| `app/verkefni/enterprice-demo/malaskraning/page.tsx` | `app/malaskraning/page.tsx` |
| `app/verkefni/enterprice-demo/thjonusta/page.tsx` | `app/thjonusta/page.tsx` |
| `app/verkefni/enterprice-demo/skyrslur/page.tsx` | `app/skyrslur/page.tsx` |
| `app/verkefni/enterprice-demo/stillingar/page.tsx` | `app/stillingar/page.tsx` |
| `app/verkefni/enterprice-demo/adgangsstyringar/page.tsx` | `app/adgangsstyringar/page.tsx` |

### 4.6 API Routes (afrita og endurnefna leiðir)

Færa úr `app/api/enterprise-demo/` í `app/api/`:

| Upprunaleg skrá | Afrita sem |
|------------------|------------|
| `app/api/enterprise-demo/notify/route.ts` | `app/api/notify/route.ts` |
| `app/api/enterprise-demo/send-bulk-email/route.ts` | `app/api/send-bulk-email/route.ts` |
| `app/api/enterprise-demo/send-car-info/route.ts` | `app/api/send-car-info/route.ts` |
| `app/api/enterprise-demo/send-reminder/route.ts` | `app/api/send-reminder/route.ts` |

### 4.7 Static skrár (afrita í `public/`)

| Upprunaleg skrá | Afrita sem |
|------------------|------------|
| `public/enterprise-logo.svg` | `public/enterprise-logo.svg` |

### 4.8 SQL skjölun (afrita í `docs/`)

| Upprunaleg skrá | Afrita sem |
|------------------|------------|
| `docs/database-admin.sql` | `docs/database-admin.sql` |
| `docs/setup-admin.sql` | `docs/setup-admin.sql` |

---

## 5. Leiðir sem þarf að breyta

Eftir afritun þarf að breyta öllum `/verkefni/enterprice-demo/` tilvísunum yfir í nýju leiðirnar.

### 5.1 href tenglar í síðum (Next.js Link)

Skipta um `/verkefni/enterprice-demo` → `` (tómt, þ.e. rót) í öllum skrám.

**Ný leið → gamul leið:**

| Gömul leið | Ný leið |
|------------|---------|
| `/verkefni/enterprice-demo` | `/` |
| `/verkefni/enterprice-demo/bilar` | `/bilar` |
| `/verkefni/enterprice-demo/bilar/${id}` | `/bilar/${id}` |
| `/verkefni/enterprice-demo/vidskiptavinir` | `/vidskiptavinir` |
| `/verkefni/enterprice-demo/vidskiptavinir/${id}` | `/vidskiptavinir/${id}` |
| `/verkefni/enterprice-demo/tengilidir` | `/tengilidir` |
| `/verkefni/enterprice-demo/solutaekifaeri` | `/solutaekifaeri` |
| `/verkefni/enterprice-demo/samningar` | `/samningar` |
| `/verkefni/enterprice-demo/verkefnalisti` | `/verkefnalisti` |
| `/verkefni/enterprice-demo/malaskraning` | `/malaskraning` |
| `/verkefni/enterprice-demo/thjonusta` | `/thjonusta` |
| `/verkefni/enterprice-demo/skyrslur` | `/skyrslur` |
| `/verkefni/enterprice-demo/stillingar` | `/stillingar` |
| `/verkefni/enterprice-demo/adgangsstyringar` | `/adgangsstyringar` |
| `/verkefni/enterprice-demo/ferlar` | `/ferlar` |

### 5.2 Skrár sem innihalda href tengla sem þarf að breyta

| Skrá | Fjöldi tilvísana |
|------|-----------------|
| `app/verkefni/enterprice-demo/layout.tsx` | 18 tilvísanir (sidebar nav, BilaLeit, logo) |
| `app/verkefni/enterprice-demo/page.tsx` | 16 tilvísanir (StatCard, widget links) |
| `app/verkefni/enterprice-demo/solutaekifaeri/page.tsx` | 4 tilvísanir (stat links) |
| `app/verkefni/enterprice-demo/vidskiptavinir/page.tsx` | 4 tilvísanir (tengiliðir link, company links) |
| `app/verkefni/enterprice-demo/vidskiptavinir/[id]/page.tsx` | 3 tilvísanir (back links, bíla links) |
| `app/verkefni/enterprice-demo/bilar/page.tsx` | 6 tilvísanir (stat links, bíla/fyrirtæki links) |
| `app/verkefni/enterprice-demo/bilar/[id]/page.tsx` | 5 tilvísanir (breadcrumb, fyrirtæki links) |
| `app/verkefni/enterprice-demo/samningar/page.tsx` | 4 tilvísanir (stat links) |
| `app/verkefni/enterprice-demo/thjonusta/page.tsx` | 1 tilvísun (bíla link) |
| `components/BilPanel.tsx` | 2 tilvísanir (bíla detail link, fyrirtæki link) |

**Einföld leit-og-skipta:** Leitaðu að `/verkefni/enterprice-demo` og skiptu út fyrir `` (tómt) í öllum `.tsx` skrám.

### 5.3 API fetch slóðir sem þarf að breyta

| Skrá | Gömul slóð | Ný slóð |
|------|-----------|---------|
| `app/verkefni/enterprice-demo/tengilidir/page.tsx` | `/api/enterprise-demo/send-bulk-email` | `/api/send-bulk-email` |
| `app/verkefni/enterprice-demo/verkefnalisti/page.tsx` | `/api/enterprise-demo/notify` | `/api/notify` |
| `app/verkefni/enterprice-demo/bilar/[id]/page.tsx` | `/api/enterprise-demo/send-car-info` | `/api/send-car-info` |
| `components/BilPanel.tsx` | `/api/enterprise-demo/send-car-info` | `/api/send-car-info` |

**Einföld leit-og-skipta:** Leitaðu að `/api/enterprise-demo/` og skiptu út fyrir `/api/` í öllum `.tsx` og `.ts` skrám.

### 5.4 Import leiðir (þurfa EKKI að breytast)

Öll imports nota `@/lib/...` og `@/components/...` path alias. Þar sem möppubygging `lib/` og `components/` helst óbreytt, þurfa **engar import leiðir að breytast** ef `tsconfig.json` path alias er rétt stillt.

---

## 6. Lykiltypar (TypeScript Interfaces)

Allar skilgreindar í `lib/enterprise-demo-data.ts`:

```typescript
type Svid = 'flotaleiga' | 'langtimaleiga'
type BilaFlokkur = 'Smábílar' | 'Fólksbílar' | 'Jepplingar' | 'Jeppar' | 'Hybrid' | 'Plug-in hybrid' | 'Rafmagnsbílar' | 'Sendibílar'

interface Fyrirtaeki { id, nafn, kennitala, heimilisfang, svid, tengiliðir[] }
interface Tengiliður { id, nafn, titill, simi, netfang, aðaltengiliður, ahugamal[], athugasemdir[], samskipti[], markhópar[], herferðir[], staða }
interface Samningur { id, fyrirtaekiId, tegund, upphaed, upphafsDagur, lokaDagur, status, billId }
interface Bill { id, tegund, arsgerð, numer, litur, akstur, flokkur, girkassing, verd, status, fyrirtaekiId?, mynd? }
interface Solutaekifaeri { id, fyrirtaekiId, lysing, upphaed, hitastig, status, dagsetning, tengilidurId?, ferilSkref[] }
interface Mal { id, titill, lysing, tegund, status, forgangur, dagsetning, fyrirtaekiId?, billId?, samningurId?, abyrgdaradili? }
interface Verkefni { id, titill, lysing, deild, status, abyrgdaradili, dagsetning, deadline?, fyrirtaekiId?, billId?, samningurId?, checklist[], athugasemdir[] }
interface Thjonustuaminning { id, billId, tegund, dagsetning, status, lysing? }
interface Notandi { id, nafn, netfang, hlutverk, svid[], virkur, sidastaInnskraning? }
interface Markhópur { id, nafn, lysing, litur }
interface Herferð { id, nafn, lysing, dagsetning, status, litur }
interface EmailTemplate { id, nafn, lysing, efni, texti, flokkur }
```

---

## 7. Síðuyfirlit — Hvað hver síða gerir

| Síða | Lýsing |
|------|--------|
| **Dashboard** (`page.tsx`) | Stjórnborð með drag-and-drop widgets, tölfræði, hraðtenglar. Sækir notandanafn frá Supabase. |
| **Bílar** (`bilar/`) | Bílaskrá: síun eftir stöðu og flokki, leit, töfluyfirlit. Stofna nýjan bíl (NyBilModal), skoða upplýsingar (BilPanel). |
| **Bíll** (`bilar/[id]/`) | Einstaklingssíða bíls: tæknilýsing, samningsupplýsingar, þjónustuferill, skjöl, senda bílaupplýsingar per email. |
| **Viðskiptavinir** (`vidskiptavinir/`) | Fyrirtækjalisti: síun eftir sviði, leit, spjöld sem opnast til að sýna tengiliði. |
| **Viðskiptavinur** (`vidskiptavinir/[id]/`) | Einstaklingssíða fyrirtækis: tengiliðir, bílar, samningar, opin mál, sölutækifæri, verkefni. |
| **Tengiliðir** (`tengilidir/`) | Tengiliðastjórnun: síun, röðun, multi-select, bulk email, CSV útflutningur, markhópar, herferðir. |
| **Sölutækifæri** (`solutaekifaeri/`) | Sölurás: Kanban, Funnel, Gantt, tortumyndir, tafla. AI-tækifærissleit (FinnaTaekifaeriPanel). |
| **Samningar** (`samningar/`) | Samningayfirlit: síun eftir tegund/stöðu, tölfræði, ítarlegar samningsupplýsingar. |
| **Verkefnalisti** (`verkefnalisti/`) | Verkefnastjórnun: mín/deildar/lokin, checklist, athugasemdir, tilkynningar. |
| **Málaskráning** (`malaskraning/`) | Kvartanir og þjónustubeiðnir: síun, röðun, CSV útflutningur, stofna/breyta mál. |
| **Þjónusta** (`thjonusta/`) | Þjónustuáminningar: síun eftir stöðu, senda email/SMS/innri tilkynningu, breyta stöðu. |
| **Skýrslur** (`skyrslur/`) | Greiningar: Yfirlit, Tekjur, Bílafloti, Samningar, Viðskiptavinir. Gröf (recharts), Excel/PDF útflutningur. |
| **Stillingar** (`stillingar/`) | Notendastjórnun: virkja/óvirkja, breyta hlutverkum, stilla sviðsaðgang. |
| **Aðgangsstýringar** (`adgangsstyringar/`) | Yfirlitssíða yfir hlutverk og heimildir. |

---

## 8. Gátlisti eftir flutning

- [ ] Öll `npm install` dependency sett upp
- [ ] `.env.local` stillt með Supabase lyklum
- [ ] Öll `/verkefni/enterprice-demo` skipt út fyrir `/` (eða nýja rót)
- [ ] Öll `/api/enterprise-demo/` skipt út fyrir `/api/`
- [ ] Enterprise theme CSS afritað í `globals.css`
- [ ] Animation CSS afritað í `globals.css`
- [ ] `public/enterprise-logo.svg` afritað
- [ ] `npm run lint` — ekkert villur
- [ ] `npm run build` — byggingin tekst
- [ ] `npm run dev` — prófað handvirkt í vafra
- [ ] Dashboard hleðst rétt
- [ ] Sidebar navigation virkar á öllum leiðum
- [ ] Dark/light theme toggle virkar
- [ ] Bílaleit í sidebar virkar
- [ ] Drag-and-drop á dashboard widgets virkar
