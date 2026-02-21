# AGENTS.md - Verkefnaleiðbeiningar

## ⚠️ CRITICAL: Build Regla

**Áður en þú klárar ALLTAF keyra:**

```bash
npm run lint # Verður að passa
npm run build # Verður að buildast
npm run dev # Prófa handvirkt
```

**ENGAR UNDANTEKNINGAR.**

---

## 📋 Um verkefnið

**Nafn:** Enterprise Leiga
**Lýsing:** Leigukerfi fyrir enterprise / tækjaleiga

---

## 🛠️ Tækni

Verkefnið notar Next.js 14+, TypeScript, Tailwind CSS og Supabase.

**Sjá ítarlega skjölun í:** `TECH_STACK.md`

---

## 🇮🇸 Tungumál

- UI texti skal vera á **íslensku**
- Breytuheiti og kóði á **ensku**
- Comments mega vera á íslensku eða ensku

---

## 📁 Möppuskipan

```
app/                # Next.js síður (App Router)
components/         # React components
  ui/               # Grunncomponents (Button, Card, etc.)
lib/                # Hjálparföll, database, types
public/             # Static skrár (myndir, etc.)
docs/               # Skjölun og SQL migrations
  migrations/       # SQL migration skrár
```

---

## 🔐 Environment Variables

Búa til `.env.local` skrá með Supabase lyklum.

**Sjá dæmi og skýringar í:** `TECH_STACK.md`

---

## 📝 Reglur fyrir AI

1. **Ekki breyta kóða** án þess að skilja hvað hann gerir
2. **Alltaf keyra build** áður en þú klárar
3. **Nota íslensku** í UI texta
4. **Fylgja DRY** - Don't Repeat Yourself
5. **Einfalda** - ekki overkomplísera lausnir

---

## 🔗 Tengd skjöl

- **TECH_STACK.md** - Ítarleg tæknileg skjölun og uppsetningu leiðbeiningar
- **README.md** - Verkefnalýsing og uppsetning
- **.env.local** - Environment variables (ekki í git)
