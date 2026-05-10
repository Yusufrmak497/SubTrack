import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      });

      const data = await res.json();

      if (res.status === 429) {
        setError('Çok fazla hatalı giriş denemesi yaptınız. Lütfen 1 dakika bekleyip tekrar deneyin.');
        return;
      }

      if (!res.ok) {
        setError(data.error || data.detail || 'Giriş başarısız');
        return;
      }

      localStorage.setItem('token', data.access_token);
      onLogin(data.access_token);
    } catch {
      setError('Sunucuya bağlanılamadı. API çalışıyor mu?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="panel login-box">
        <h1>TinyVault</h1>
        <p className="muted">Aboneliklerini yönet</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Kullanıcı adı"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
