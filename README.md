# Enterprise Leiga

Leigukerfi fyrir enterprise / tækjaleiga.

## Tæknistakkur

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Deployment:** Vercel

## Uppsetning

### 1. Setja upp dependencies

```bash
npm install
```

### 2. Stilla Supabase

1. Búa til aðgang á [supabase.com](https://supabase.com)
2. Búa til nýtt project
3. Búa til `.env.local` skrá:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 3. Keyra verkefnið

```bash
npm run dev
```

Opna [http://localhost:3000](http://localhost:3000) í vafra.

## Skipanir

```bash
npm run dev          # Keyra locally
npm run build        # Byggja fyrir production
npm run start        # Keyra production build
npm run lint         # Athuga kóða
```

## Höfundur

Búið til með Cursor AI
