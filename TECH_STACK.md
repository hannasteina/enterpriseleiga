# Tæknistakkur (Tech Stack)

## 📋 Yfirlit

Enterprise Leiga - leigukerfi byggt á nútímalegum vefþróunarstakk.

---

## 🖥️ Frontend

### Next.js 14+ (App Router)
- **Hvað:** React framework með server-side rendering (SSR) og static generation (SSG)
- **Af hverju:** Hraðvirkt, SEO-vingjarnlegt, innbyggð routing
- **Skjölun:** https://nextjs.org/docs

### TypeScript
- **Hvað:** JavaScript með týpum (types)
- **Af hverju:** Minni villur, betri autocomplete, auðveldara að viðhalda kóða

### Tailwind CSS
- **Hvað:** Utility-first CSS framework
- **Af hverju:** Hröð þróun, samræmt útlit, engin CSS skrár

### React
- **Hvað:** Component-based UI library
- **Af hverju:** Endurnýtanlegir components, stórt ecosystem

---

## 🗄️ Backend & Gagnagrunnur

### Supabase
- **Hvað:** Open-source Firebase alternative
- **Inniheldur:**
  - **PostgreSQL** - Relational database
  - **Auth** - Notendastjórnun og innskráning
  - **Storage** - Skráageymsla (myndir, PDF, etc.)
  - **Realtime** - Live uppfærslur
  - **Edge Functions** - Serverless functions
- **Skjölun:** https://supabase.com/docs

---

## 🚀 Deployment & Hosting

### Vercel
- **Hvað:** Hosting platform fyrir Next.js
- **Af hverju:** Sjálfvirkt deployment frá GitHub, hraðvirkt CDN, preview URLs

### GitHub
- **Hvað:** Version control og kóðageymsla
- **Af hverju:** Samvinna, backup, tengist Vercel

---

## 📁 Möppuskipan

```
enterpriseleiga/
├── app/                    # Next.js App Router síður
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Forsíða (/)
│   ├── globals.css         # Global styles
│   └── api/                # API routes
├── components/             # React components
│   └── ui/                 # Grunncomponents (Button, Card, etc.)
├── lib/                    # Hjálparföll og config
│   ├── supabase.ts         # Supabase client
│   ├── utils.ts            # Utility functions
│   └── types.ts            # TypeScript types
├── public/                 # Static skrár (myndir, favicon)
├── docs/                   # Skjölun
│   └── migrations/         # SQL migrations
├── .env.local              # Environment variables (EKKI í git!)
├── package.json            # Dependencies
├── tailwind.config.ts      # Tailwind stillingar
├── tsconfig.json           # TypeScript stillingar
├── AGENTS.md               # AI leiðbeiningar
├── TECH_STACK.md           # Tæknistakkur (þessi skrá)
└── README.md               # Verkefnalýsing
```

---

## 🔐 Environment Variables

Skrá `.env.local` (ALDREI commita þessa skrá!):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

---

## 🏃 Skipanir

```bash
npm run dev          # Keyra locally (localhost:3000)
npm run build        # Byggja fyrir production
npm run start        # Keyra production build locally
npm run lint         # Athuga kóða villur
```

---

## 🔗 Tenglar

- **Next.js:** https://nextjs.org
- **Supabase:** https://supabase.com
- **Tailwind:** https://tailwindcss.com
- **Vercel:** https://vercel.com
- **TypeScript:** https://typescriptlang.org
