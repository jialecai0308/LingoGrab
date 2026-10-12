const PRIMARY_HOST = 'lingograb.com'
const LEGACY_HOSTS = new Set([
  'lingograb.getyuli.com',
  'www.lingograb.com',
])

export function middleware(context) {
  const url = new URL(context.request.url)
  if (!LEGACY_HOSTS.has(url.hostname.toLowerCase())) return context.next()

  url.protocol = 'https:'
  url.hostname = PRIMARY_HOST
  url.port = ''
  return context.redirect(url.toString(), 301)
}

export const config = {
  matcher: '/:path*',
}
