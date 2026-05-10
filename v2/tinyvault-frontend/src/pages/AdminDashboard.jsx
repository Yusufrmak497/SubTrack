import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import './AdminDashboard.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const ROLE_OPTIONS = ['admin', 'user', 'viewer']
const ROLE_BG    = { admin: '#fef3c7', user: '#dbeafe', viewer: '#f3f4f6' }
const ROLE_COLOR = { admin: '#92400e', user: '#1e40af', viewer: '#374151' }

export default function AdminDashboard({ token, onUnauthorized }) {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  const authHeaders = { Authorization: `Bearer ${token}` }

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/users`, { headers: authHeaders })
      if (res.status === 401 || res.status === 403) { onUnauthorized(); return }
      setUsers(await res.json())
    } catch {
      toast.error('Kullanıcılar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [token]) // eslint-disable-line

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function changeRole(userId, newRole) {
    const prev = users
    setUsers((u) => u.map((x) => (x.id === userId ? { ...x, role: newRole } : x)))
    try {
      const res = await fetch(`${API}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error()
      toast.success('Rol güncellendi')
    } catch {
      setUsers(prev)
      toast.error('Rol güncellenemedi')
    }
  }

  async function toggleStatus(userId) {
    const prev = users
    setUsers((u) => u.map((x) => (x.id === userId ? { ...x, is_active: !x.is_active } : x)))
    try {
      const res = await fetch(`${API}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: authHeaders,
      })
      if (!res.ok) throw new Error()
      toast.success('Durum güncellendi')
    } catch {
      setUsers(prev)
      toast.error('Durum güncellenemedi')
    }
  }

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total:   users.length,
    active:  users.filter((u) => u.is_active).length,
    admins:  users.filter((u) => u.role === 'admin').length,
    viewers: users.filter((u) => u.role === 'viewer').length,
  }

  return (
    <main className="admin-main">
      <div className="admin-title-row">
        <h1 className="admin-title">Admin Dashboard</h1>
        <p className="admin-subtitle">Kullanıcıları yönetin, rolleri ve durumları değiştirin.</p>
      </div>

      {/* STATS */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Toplam Kullanıcı</div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-value" style={{ color: '#16a34a' }}>{stats.active}</div>
          <div className="stat-label">Aktif</div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-value" style={{ color: '#92400e' }}>{stats.admins}</div>
          <div className="stat-label">Admin</div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-value" style={{ color: '#374151' }}>{stats.viewers}</div>
          <div className="stat-label">Viewer</div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="admin-search-row">
        <input
          className="admin-search"
          type="text"
          placeholder="Kullanıcı adı veya e-posta ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="admin-count">{filtered.length} kullanıcı</span>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="admin-loading">Yükleniyor...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Kullanıcı Adı</th>
                <th>E-posta</th>
                <th>Rol</th>
                <th>Durum</th>
                <th>Kayıt Tarihi</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className={!user.is_active ? 'row-inactive' : ''}>
                  <td className="td-id">#{user.id}</td>
                  <td className="td-username">{user.username}</td>
                  <td className="td-email">{user.email}</td>
                  <td>
                    <select
                      className="role-select"
                      value={user.role}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      style={{ background: ROLE_BG[user.role], color: ROLE_COLOR[user.role] }}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>
                      {user.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="td-date">
                    {new Date(user.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td>
                    <button
                      className={`toggle-btn ${user.is_active ? 'toggle-deactivate' : 'toggle-activate'}`}
                      onClick={() => toggleStatus(user.id)}
                    >
                      {user.is_active ? 'Devre Dışı' : 'Etkinleştir'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="admin-empty">Sonuç bulunamadı.</div>
          )}
        </div>
      )}
    </main>
  )
}
