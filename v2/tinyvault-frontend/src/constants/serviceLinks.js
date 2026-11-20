const SERVICE_LOGIN_URLS = {
  spotify: 'https://accounts.spotify.com/en/login',
  netflix: 'https://www.netflix.com/login',
  youtube: 'https://accounts.google.com/signin',
  'youtube premium': 'https://accounts.google.com/signin',
  'youtube music': 'https://accounts.google.com/signin',
}

function normalizeServiceName(serviceName) {
  return serviceName.trim().toLowerCase()
}

export function getServiceLoginUrl(serviceName) {
  if (!serviceName) {
    return null
  }

  return SERVICE_LOGIN_URLS[normalizeServiceName(serviceName)] ?? null
}
