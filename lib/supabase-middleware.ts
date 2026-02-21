import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/signup', '/reset-password', '/update-password', '/auth'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin/')) return true;
  if (pathname.startsWith('/auth/')) return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.includes('.')) return true;
  return false;
}

export async function handleMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in -> redirect to /login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Check if user is disabled
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_disabled')
    .eq('user_id', user.id)
    .single();

  if (profile?.is_disabled) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('disabled', 'true');
    return NextResponse.redirect(url);
  }

  // Admin check
  const { data: adminRecord } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  const userIsAdmin = !!adminRecord;

  // /admin/* requires admin
  if (pathname.startsWith('/admin')) {
    if (!userIsAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('no_admin_access', 'true');
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  return supabaseResponse;
}
