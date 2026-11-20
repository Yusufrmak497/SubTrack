import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function OAuthCallback({ onLogin }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token = params.get('token')
    const role = params.get('role') || 'user'
    const username = params.get('username') || ''
    const error = params.get('error')

    if (error) {
      navigate(`/login?error=${error}`, { replace: true })
      return
    }

    if (!token) {
      navigate('/login?error=no_token', { replace: true })
      return
    }

    localStorage.setItem('token', token)
    localStorage.setItem('role', role)
    localStorage.setItem('username', username)
    onLogin(token, role)
    navigate(role === 'admin' ? '/admin' : '/app', { replace: true })
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: 'var(--muted)' }}>Signing in...</p>
    </div>
  )
}
