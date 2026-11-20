import { createHmac } from 'crypto'

const URL = 'http://localhost:5173'
const API = 'http://localhost:8000'

// TOTP secret shared with the backend seed (ADMIN_TEST_TOTP_SECRET env var)
const ADMIN_TOTP_SECRET = process.env.ADMIN_TEST_TOTP_SECRET || 'JBSWY3DPEHPK3PXP'

function base32decode(base32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const str = base32.toUpperCase().replace(/=+$/, '')
  let bits = 0, value = 0
  const output = []
  for (let i = 0; i < str.length; i++) {
    value = (value << 5) | chars.indexOf(str[i])
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(output)
}

function generateTOTP(secret, time = Math.floor(Date.now() / 1000)) {
  const counter = Math.floor(time / 30)
  const key = base32decode(secret)
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter))
  const hmac = createHmac('sha1', key).update(buf).digest()
  const offset = hmac[19] & 0xf
  const code = ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return String(code % 1_000_000).padStart(6, '0')
}

/**
 * Fast API-based admin login — bypasses UI to avoid rate limiting.
 * Sets localStorage directly and navigates to /admin.
 * Use this in beforeEach hooks where the test is about admin dashboard, not the login flow.
 */
export async function loginAsAdminFast(page) {
  // Step 1: password auth
  const res1 = await page.request.post(`${API}/auth/login`, {
    form: { username: 'admin_rojhat', password: 'admin123' },
  })
  const data1 = await res1.json()

  let token, role, username

  if (data1.requires_2fa) {
    // Step 2: TOTP verify
    const code = generateTOTP(ADMIN_TOTP_SECRET)
    const res2 = await page.request.post(`${API}/auth/2fa/verify`, {
      data: { code, method: 'totp', temp_token: data1.temp_token },
    })
    const data2 = await res2.json()
    token = data2.access_token
    role = data2.role
    username = data2.username
  } else {
    token = data1.access_token
    role = data1.role
    username = data1.username
  }

  // Inject into localStorage and navigate to the role-appropriate dashboard
  await page.goto(`${URL}/login`)
  await page.evaluate(([t, r, u]) => {
    localStorage.setItem('token', t)
    localStorage.setItem('role', r)
    localStorage.setItem('username', u)
  }, [token, role, username])
  const dest = role === 'admin' ? `${URL}/admin` : `${URL}/app`
  await page.goto(dest)
  const waitSel = role === 'admin' ? '.admin-stats' : '.subscription-list, .content'
  await page.waitForSelector(waitSel, { timeout: 10000 }).catch(() => page.waitForLoadState('networkidle'))
}

/**
 * Full UI admin login including 2FA TOTP step.
 * Use this for tests that specifically test the login / 2FA flow.
 */
export async function loginAsAdminUI(page) {
  await page.goto(`${URL}/login`)
  await page.fill('input[placeholder="username"]', 'admin_rojhat')
  await page.fill('input[placeholder="••••••"]', 'admin123')
  await page.click('button[type="submit"]')

  // Handle 2FA step if it appears
  const twoFaInput = page.locator('input[placeholder="123456"]')
  const appeared = await twoFaInput.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false)
  if (appeared) {
    const code = generateTOTP(ADMIN_TOTP_SECRET)
    await twoFaInput.fill(code)
    await page.click('button[type="submit"]')
  }

  await page.waitForURL(`${URL}/admin`, { timeout: 10000 })
  await page.waitForLoadState('networkidle')
}
