import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import './index.css'

const API = '/api'
const POLL_MS = 2000

// ─── Utility ─────────────────────────────────────────────────────────────────
function formatTime(secs) {
  if (!secs || secs < 0) return '00:00:00'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

function getSteamImgUrl(appid) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_sm_120.jpg`
}

// Dakikayı okunabilir saate çevir
function formatPlaytime(minutes) {
  if (!minutes || minutes === 0) return '0 saat'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} dk`
  if (m === 0) return `${h} saat`
  return `${h}s ${m}dk`
}

function timeAgo(ms) {
  const diff = Date.now() - ms
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  if (days > 0) return `${days} gün önce kaydedildi`
  if (hours > 0) return `${hours} saat önce kaydedildi`
  return 'Az önce kaydedildi'
}

// ─── Status helpers ───────────────────────────────────────────────────────────
function statusLabel(state) {
  if (state.idlingGames && state.idlingGames.length > 0) return 'Saat Kasılıyor'
  if (state.status === 'connected') return 'Bağlı'
  if (state.status === 'connecting') return 'Bağlanıyor...'
  if (state.status === 'steamguard') return 'Steam Guard Bekleniyor'
  if (state.status === 'qr') return 'QR Bekleniyor'
  if (state.status === 'error') return 'Hata'
  return 'Bağlı Değil'
}

function statusDotClass(state) {
  if (state.idlingGames && state.idlingGames.length > 0) return 'idling'
  if (state.status === 'qr') return 'steamguard'
  return state.status
}

// ─── QRLoginPanel ─────────────────────────────────────────────────────────────
function QRLoginPanel({ qrCodeImage, onCancel }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="alert alert-info" style={{ marginBottom: 20, textAlign: 'left' }}>
        <span>📱</span>
        <div>
          <strong>Steam Mobil Uygulaması ile Tara</strong><br />
          <small>Steam app → Sağ üst profil → <strong>Oturum Aç</strong> → QR tara</small>
        </div>
      </div>

      {qrCodeImage ? (
        <div style={{
          display: 'inline-block',
          padding: 12,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 0 30px rgba(26,108,255,0.3)',
          marginBottom: 16,
        }}>
          <img src={qrCodeImage} alt="QR Kod" style={{ width: 220, height: 220, display: 'block' }} />
        </div>
      ) : (
        <div className="alert alert-warning" style={{ justifyContent: 'center' }}>
          <span className="spinner" /> QR kod oluşturuluyor...
        </div>
      )}

      <p className="form-hint" style={{ marginBottom: 16 }}>
        Kod her 30 saniyede yenilenir. Tarayıcıyı yenilemenize gerek yok.
      </p>

      <button className="btn btn-ghost btn-full btn-sm" onClick={onCancel}>
        ← Geri Dön
      </button>
    </div>
  )
}

// ─── SavedAccounts ────────────────────────────────────────────────────────────
function SavedAccounts({ onLoginWithToken, onNewLogin }) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState({})
  const [deleting, setDeleting] = useState({})

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/saved-accounts`)
      setAccounts(res.data)
    } catch (e) { }
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  const handleLogin = async (username) => {
    setLoading(prev => ({ ...prev, [username]: true }))
    try {
      await onLoginWithToken(username)
    } finally {
      setLoading(prev => ({ ...prev, [username]: false }))
    }
  }

  const handleDelete = async (username) => {
    setDeleting(prev => ({ ...prev, [username]: true }))
    try {
      await axios.delete(`${API}/saved-accounts/${username}`)
      await fetchAccounts()
    } finally {
      setDeleting(prev => ({ ...prev, [username]: false }))
    }
  }

  if (accounts.length === 0) return null

  return (
    <div style={{ marginBottom: 24 }}>
      <p className="form-label" style={{ marginBottom: 12 }}>
        💾 Kayıtlı Hesaplar
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {accounts.map(acc => (
          <div key={acc.username} className="saved-account-row">
            <div className="saved-account-avatar">
              {(acc.displayName || acc.username)[0]?.toUpperCase()}
            </div>
            <div className="saved-account-info">
              <div className="saved-account-name">{acc.displayName || acc.username}</div>
              <div className="saved-account-sub">
                @{acc.username} · {timeAgo(acc.savedAt)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                id={`login-token-${acc.username}`}
                className="btn btn-primary btn-sm"
                onClick={() => handleLogin(acc.username)}
                disabled={loading[acc.username]}
              >
                {loading[acc.username]
                  ? <><span className="spinner" /> Giriliyor...</>
                  : '▶ Giriş Yap'
                }
              </button>
              <button
                id={`delete-account-${acc.username}`}
                className="btn btn-ghost btn-sm"
                onClick={() => handleDelete(acc.username)}
                disabled={deleting[acc.username]}
                title="Kayıtlı hesabı sil"
                style={{ padding: '8px 10px', color: 'var(--danger)' }}
              >
                {deleting[acc.username] ? <span className="spinner" /> : '🗑️'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="section-divider" />
      <button
        id="new-login-btn"
        className="btn btn-ghost btn-full btn-sm"
        onClick={onNewLogin}
      >
        + Farklı Hesapla Giriş Yap
      </button>
    </div>
  )
}

// ─── LoginForm ────────────────────────────────────────────────────────────────
function LoginForm({ onLoading, hasSavedAccounts, onBack }) {
  const [form, setForm] = useState({ username: '', password: '', sharedSecret: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.username.trim() || !form.password.trim()) {
      setError('Kullanıcı adı ve şifre gereklidir.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(`${API}/login`, {
        username: form.username.trim(),
        password: form.password,
        sharedSecret: form.sharedSecret.trim()
      })
      if (!res.data.success) setError(res.data.error || 'Giriş başarısız.')
      else onLoading?.()
    } catch (err) {
      setError(err.response?.data?.error || 'Sunucuya bağlanılamadı. Backend çalışıyor mu?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {hasSavedAccounts && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onBack}
          style={{ marginBottom: 16, color: 'var(--text-secondary)' }}
        >
          ← Geri Dön
        </button>
      )}

      <div className="alert alert-info" style={{ marginBottom: 16 }}>
        <span>ℹ️</span>
        <div>İlk girişten sonra <strong>şifreniz kaydedilmez</strong>, yerel bir oturum tokeni oluşturulur.
          Bir sonraki açılışta şifre gerekmez.</div>
      </div>

      {error && (
        <div className="alert alert-error fade-in">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Steam Kullanıcı Adı</label>
        <input id="username" className="form-input" name="username" type="text"
          autoComplete="username" placeholder="kullanici_adiniz"
          value={form.username} onChange={handleChange} disabled={loading} />
      </div>

      <div className="form-group">
        <label className="form-label">Şifre</label>
        <div style={{ position: 'relative' }}>
          <input id="password" className="form-input" name="password"
            type={showPass ? 'text' : 'password'} autoComplete="current-password"
            placeholder="••••••••" value={form.password} onChange={handleChange}
            disabled={loading} style={{ paddingRight: '44px' }} />
          <button type="button" onClick={() => setShowPass(p => !p)} style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)'
          }}>{showPass ? '🙈' : '👁️'}</button>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 20 }}>
        <label className="form-label">
          Shared Secret{' '}
          <span className="badge badge-primary" style={{ fontSize: 10, verticalAlign: 'middle' }}>OPSİYONEL</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input id="sharedSecret" className="form-input" name="sharedSecret"
            type={showSecret ? 'text' : 'password'}
            placeholder="Mobile Authenticator otomatik kodu"
            value={form.sharedSecret} onChange={handleChange} disabled={loading}
            style={{ paddingRight: '44px', fontFamily: 'monospace' }} />
          <button type="button" onClick={() => setShowSecret(p => !p)} style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)'
          }}>{showSecret ? '🙈' : '👁️'}</button>
        </div>
        <p className="form-hint">Boş bırakırsanız Steam Guard ekranı açılır.</p>
      </div>

      <button id="login-btn" type="submit" className="btn btn-primary btn-full" disabled={loading}>
        {loading
          ? <><span className="spinner" /> Bağlanıyor...</>
          : <><span>🎮</span> Steam'e Giriş Yap (İlk Kez)</>
        }
      </button>

      <div className="warn-banner">
        <span>⚠️</span>
        <div>Şifreniz bu cihaza <strong>kaydedilmez</strong>. Sadece Steam'in verdiği oturum tokeni yerel olarak saklanır.</div>
      </div>
    </form>
  )
}

// ─── SteamGuardForm ───────────────────────────────────────────────────────────
function SteamGuardForm({ guardType }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    if (!code.trim()) { setError('Kod boş olamaz.'); return }
    setLoading(true); setError('')
    try {
      await axios.post(`${API}/steamguard`, { code: code.trim() })
    } catch (err) {
      setError(err.response?.data?.error || 'Kod gönderilemedi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="alert alert-warning fade-in" style={{ marginBottom: 16 }}>
        <span>🔒</span>
        <div>
          <strong>Steam Guard Doğrulaması</strong><br />
          {guardType === 'email'
            ? 'Steam\'in gönderdiği e-postadaki 5 haneli kodu girin.'
            : 'Steam Authenticator uygulamasındaki kodu girin.'
          }
          <br />
          <small style={{ opacity: 0.75 }}>
            Bu işlemi bir kez yapmanız yeterli — sonraki açılışlarda otomatik giriş olur.
          </small>
        </div>
      </div>
      {error && <div className="alert alert-error fade-in"><span>⚠️</span> {error}</div>}
      <div className="form-group">
        <label className="form-label">Doğrulama Kodu</label>
        <input id="steamguard-code" className="form-input" type="text" maxLength={10}
          placeholder="XXXXX" value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          disabled={loading}
          style={{ fontFamily: 'monospace', fontSize: 22, textAlign: 'center', letterSpacing: 8 }}
          autoFocus />
      </div>
      <button id="steamguard-submit" type="submit" className="btn btn-primary btn-full" disabled={loading}>
        {loading ? <><span className="spinner" /> Gönderiliyor...</> : <><span>✅</span> Doğrula</>}
      </button>
    </form>
  )
}

// ─── GameItem ─────────────────────────────────────────────────────────────────
function GameItem({ game, selected, onToggle }) {
  const [imgError, setImgError] = useState(false)
  return (
    <div id={`game-${game.appid}`} className={`game-item ${selected ? 'selected' : ''}`}
      onClick={() => onToggle(game.appid)}>
      <div className="game-check">{selected && '✓'}</div>
      {imgError ? (
        <div className="game-img-placeholder">🎮</div>
      ) : (
        <img className="game-img" src={getSteamImgUrl(game.appid)} alt={game.name}
          onError={() => setImgError(true)} />
      )}
      <div className="game-info">
        <div className="game-name">{game.name}</div>
        <div className="game-appid">
          AppID: {game.appid}
          {game.playtime > 0 && (
            <span style={{ marginLeft: 8, color: 'var(--accent)', fontWeight: 600 }}>
              ⏱ {formatPlaytime(game.playtime)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── GameSelector ─────────────────────────────────────────────────────────────
function GameSelector({ games, selectedGames, onToggle }) {
  const [search, setSearch] = useState('')
  const filtered = games.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    String(g.appid).includes(search)
  )
  return (
    <>
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input id="game-search" type="text" placeholder="Oyun adı veya AppID ile ara..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🔎</span>
          <div className="empty-state-title">Oyun bulunamadı</div>
          <p>Farklı bir terim deneyin veya manuel AppID ekleyin.</p>
        </div>
      ) : (
        <div className="games-list">
          {filtered.map(g => (
            <GameItem key={g.appid} game={g} selected={selectedGames.includes(g.appid)} onToggle={onToggle} />
          ))}
        </div>
      )}
    </>
  )
}

// ─── AddGameForm ──────────────────────────────────────────────────────────────
function AddGameForm({ onAdded }) {
  const [appid, setAppid] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!appid.trim()) return
    setLoading(true)
    try {
      await axios.post(`${API}/games/add`, { appid: parseInt(appid), name: name.trim() || `App ${appid}` })
      onAdded?.({ appid: parseInt(appid), name: name.trim() || `App ${appid}`, playtime: 0 })
      setAppid(''); setName('')
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div className="section-divider" />
      <p className="form-label" style={{ marginBottom: 10 }}>Manuel Oyun Ekle (AppID)</p>
      <div className="add-game-row">
        <div className="form-group">
          <input id="manual-appid" className="form-input" type="number"
            placeholder="Örn: 730" value={appid} onChange={e => setAppid(e.target.value)} />
        </div>
        <div className="form-group" style={{ flex: 1.5 }}>
          <input id="manual-game-name" className="form-input" type="text"
            placeholder="Oyun adı (opsiyonel)" value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        </div>
        <button id="manual-add-btn" type="button" className="btn btn-ghost btn-sm"
          onClick={handleAdd} disabled={!appid.trim() || loading}
          style={{ marginBottom: 0, flexShrink: 0 }}>
          {loading ? <span className="spinner" /> : '+ Ekle'}
        </button>
      </div>
      <p className="form-hint">
        AppID: <a href="https://store.steampowered.com" target="_blank" rel="noreferrer">store.steampowered.com</a> → oyun → URL'deki sayı
      </p>
    </div>
  )
}

// ─── IdleHistory ──────────────────────────────────────────────────────────────
function IdleHistory({ refreshKey }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/history`)
      setHistory(res.data)
    } catch (e) { }
  }, [])

  // İlk yükleme + refreshKey değişince + her 5 saniyede yenile
  useEffect(() => {
    fetchHistory()
    const interval = setInterval(fetchHistory, 5000)
    return () => clearInterval(interval)
  }, [fetchHistory, refreshKey])

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/history/${id}`)
      setHistory(prev => prev.filter(h => h.id !== id))
    } catch (e) { }
  }

  const handleClearAll = async () => {
    setLoading(true)
    try {
      await axios.delete(`${API}/history`)
      setHistory([])
    } catch (e) { }
    finally { setLoading(false) }
  }

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="card fade-in">
      <div className="card-title">
        <span className="card-title-icon">📋</span>
        Geçmiş Oturumlar
        {history.length > 0 && (
          <button
            id="clear-history-btn"
            className="btn btn-ghost btn-sm"
            onClick={handleClearAll}
            disabled={loading}
            style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--danger)', padding: '4px 10px' }}
          >
            {loading ? <span className="spinner" /> : '🗑 Tümünü Sil'}
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="empty-state" style={{ padding: '32px 16px' }}>
          <span className="empty-state-icon" style={{ fontSize: 36 }}>📭</span>
          <div className="empty-state-title">Henüz geçmiş yok</div>
          <p>Saat kasımını durdurunca oturumlar burada görünecek.</p>
        </div>
      ) : (
        <div className="history-scroll">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map(entry => (
              <div key={entry.id} className="history-row">
                <div className="history-main">
                  <div className="history-games">
                    {entry.games.map((g, i) => (
                      <span key={i} className="history-game-tag">{g.name}</span>
                    ))}
                  </div>
                  <div className="history-meta">
                    <span className="history-duration">⏱ {formatTime(entry.durationSeconds)}</span>
                    <span className="history-sep">·</span>
                    <span className="history-date">{formatDate(entry.date)}</span>
                    {entry.displayName && (
                      <><span className="history-sep">·</span>
                        <span className="history-user">@{entry.displayName}</span></>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleDelete(entry.id)}
                  style={{ padding: '4px 8px', color: 'var(--text-muted)', flexShrink: 0 }}
                  title="Kaydı sil"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── IdlePanel ────────────────────────────────────────────────────────────────
function IdlePanel({ state, games, selectedGames, onToggle, onStartIdle, onStopIdle }) {
  const isIdling = state.idlingGames && state.idlingGames.length > 0
  const idlingGameNames = (state.idlingGames || []).map(id => {
    const g = games.find(g => g.appid === id)
    return g ? g.name : `App ${id}`
  })
  const hoursDecimal = state.totalIdleTime ? (state.totalIdleTime / 3600).toFixed(2) : '0.00'

  return (
    <div className="idle-panel fade-in">
      {/* Timer — tam genişlik */}
      <div className="stat-box-timer">
        <div className="stat-value-timer">{formatTime(state.totalIdleTime)}</div>
        <div className="stat-label">Geçen Süre</div>
      </div>
      {/* Alt satır: Saat + Oyun */}
      <div className="idle-stats-row">
        <div className="stat-box">
          <div className="stat-value">{hoursDecimal}</div>
          <div className="stat-label">Toplam Saat</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{isIdling ? state.idlingGames.length : selectedGames.length}</div>
          <div className="stat-label">Oyun Sayısı</div>
        </div>
      </div>

      {isIdling && (
        <div className="idling-games-list">
          {idlingGameNames.map((name, i) => (
            <div key={i} className="game-chip">
              <span className="game-chip-dot" />
              {name}
            </div>
          ))}
        </div>
      )}

      {!isIdling && selectedGames.length === 0 && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <span>ℹ️</span> Sağ taraftan oyun seçin, ardından başlatın.
        </div>
      )}

      {!isIdling && selectedGames.length > 0 && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <span>✅</span> <strong>{selectedGames.length} oyun seçildi.</strong>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        {!isIdling ? (
          <button id="start-idle-btn" className="btn btn-success btn-full"
            onClick={() => onStartIdle(selectedGames)} disabled={selectedGames.length === 0}>
            <span>▶️</span> Başlat
          </button>
        ) : (
          <button id="stop-idle-btn" className="btn btn-danger btn-full" onClick={onStopIdle}>
            <span>⏹️</span> Durdur
          </button>
        )}
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState] = useState(null)
  const [selectedGames, setSelectedGames] = useState([])
  const [extraGames, setExtraGames] = useState([])
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [savedAccounts, setSavedAccounts] = useState([])
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)

  const fetchState = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/state`)
      setState(res.data)
    } catch (e) { }
  }, [])

  const fetchSavedAccounts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/saved-accounts`)
      setSavedAccounts(res.data)
    } catch (e) { }
  }, [])

  useEffect(() => {
    fetchState()
    fetchSavedAccounts()
    const interval = setInterval(fetchState, POLL_MS)
    return () => clearInterval(interval)
  }, [fetchState, fetchSavedAccounts])

  const handleLoginWithToken = async (username) => {
    await axios.post(`${API}/login/token`, { username })
    fetchState()
  }

  const handleToggleGame = useCallback((appid) => {
    setSelectedGames(prev =>
      prev.includes(appid) ? prev.filter(id => id !== appid) : [...prev, appid]
    )
  }, [])

  const handleStartIdle = async (appids) => {
    await axios.post(`${API}/idle/start`, { appids })
    fetchState()
  }

  const handleStopIdle = async () => {
    await axios.post(`${API}/idle/stop`)
    setSelectedGames([])
    setHistoryKey(k => k + 1)
    // Steam'den güncel playtime verilerini çek (arka planda)
    axios.post(`${API}/games/refresh`).catch(() => { })
    // Biraz bekle, sonra state'i yenile (refresh async çalışıyor)
    setTimeout(fetchState, 2000)
    fetchState()
  }

  const handleLogout = async () => {
    setLogoutLoading(true)
    await axios.post(`${API}/logout`)
    setSelectedGames([])
    setExtraGames([])
    setLogoutLoading(false)
    setShowLoginForm(false)
    fetchState()
    fetchSavedAccounts()
  }

  const allGames = state
    ? [...(state.games || []), ...extraGames.filter(eg => !state.games?.find(g => g.appid === eg.appid))]
    : []

  const isConnected = state?.loggedIn
  const isSteamGuard = state?.status === 'steamguard'
  const isConnecting = state?.status === 'connecting'
  const isQR = state?.status === 'qr'
  const isIdling = state?.idlingGames?.length > 0
  const hasSavedAccounts = savedAccounts.length > 0

  // Giriş panelinde ne gösterilecek?
  const startQRLogin = async () => {
    await axios.post(`${API}/login/qr`)
    fetchState()
  }

  const renderLoginPanel = () => {
    if (isConnecting) {
      return (
        <>
          <div className="card-title"><span className="card-title-icon">⏳</span> Bağlanıyor</div>
          <div className="alert alert-warning">
            <span className="spinner" /> Steam'e bağlanılıyor, lütfen bekleyin...
          </div>
        </>
      )
    }

    if (isSteamGuard) {
      return (
        <>
          <div className="card-title"><span className="card-title-icon">🔒</span> Steam Guard</div>
          <SteamGuardForm guardType={state.steamGuardType} />
        </>
      )
    }

    if (isQR) {
      return (
        <>
          <div className="card-title"><span className="card-title-icon">📷</span> QR ile Giriş</div>
          <QRLoginPanel
            qrCodeImage={state.qrCodeImage}
            onCancel={() => axios.post(`${API}/logout`).then(fetchState)}
          />
        </>
      )
    }

    // Kayıtlı hesap varsa onları göster
    if (hasSavedAccounts) {
      return (
        <>
          <div className="card-title"><span className="card-title-icon">🔑</span> Hesap Seçin</div>
          <SavedAccounts
            onLoginWithToken={handleLoginWithToken}
            onNewLogin={startQRLogin}
          />
        </>
      )
    }

    // Varsayılan: QR ile giriş ekranı göster
    return (
      <>
        <div className="card-title"><span className="card-title-icon">🔑</span> Steam Girişi</div>
        <div className="empty-state" style={{ padding: '24px 0 16px' }}>
          <span style={{ fontSize: 56, display: 'block', marginBottom: 12 }}>📱</span>
          <div className="empty-state-title">QR Kod ile Giriş Yap</div>
          <p style={{ marginBottom: 20 }}>
            Kullanıcı adı veya şifre gerekmez.<br />
            Steam mobil uygulamasıyla QR taratarak giriş yapın.
          </p>
          <button
            id="qr-login-btn"
            className="btn btn-primary btn-full"
            onClick={startQRLogin}
          >
            <svg height="18" width="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="3" height="3" rx="0.5" />
              <rect x="18" y="14" width="3" height="3" rx="0.5" /><rect x="14" y="18" width="3" height="3" rx="0.5" />
              <rect x="18" y="18" width="3" height="3" rx="0.5" />
            </svg>
            QR Kodu Göster
          </button>
        </div>
      </>
    )
  }

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <div className="logo-icon">🎮</div>
          <div>
            <div className="logo-text">Steam Idler</div>
            <div className="logo-sub">Saat Kasma Aracı</div>
          </div>
        </div>
        {state && (
          <div className="header-status">
            <span className={`status-dot ${statusDotClass(state)}`} />
            <span style={{ color: isIdling ? 'var(--success)' : 'var(--text-secondary)' }}>
              {statusLabel(state)}
            </span>
            {isConnected && state.displayName && (
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                · {state.displayName}
              </span>
            )}
          </div>
        )}
      </header>

      {/* Main */}
      <main className="main-grid">
        {/* Left */}
        <div className="left-col">
          <div className="card fade-in">
            {!isConnected && renderLoginPanel()}

            {isConnected && (
              <>
                <div className="card-title"><span className="card-title-icon">👤</span> Hesap</div>
                <div className="profile-card" style={{ marginBottom: 20 }}>
                  <div className="profile-avatar">
                    {state.avatarUrl
                      ? <img src={state.avatarUrl} alt="avatar" />
                      : (state.displayName || state.username || '?')[0]?.toUpperCase()
                    }
                  </div>
                  <div className="profile-info">
                    <div className="profile-name">{state.displayName || state.username}</div>
                    <div style={{ marginTop: 4 }}>
                      <span className="badge badge-success">● Çevrimiçi</span>
                    </div>
                  </div>
                </div>
                <button id="logout-btn" className="btn btn-ghost btn-full btn-sm"
                  onClick={handleLogout} disabled={logoutLoading || isIdling}>
                  {logoutLoading ? <><span className="spinner" /> Çıkış yapılıyor...</> : '🚪 Çıkış Yap'}
                </button>
                {isIdling && (
                  <p className="form-hint" style={{ textAlign: 'center', marginTop: 8 }}>
                    Önce kasımı durdurun.
                  </p>
                )}
              </>
            )}

            {state?.status === 'error' && (
              <div className="alert alert-error fade-in" style={{ marginTop: 12 }}>
                <span>⚠️</span> {state.errorMessage || 'Bilinmeyen hata oluştu.'}
              </div>
            )}
          </div>

          {isConnected && (
            <div className="card fade-in">
              <div className="card-title">
                <span className="card-title-icon">⏱️</span>
                Saat Kasma Durumu
                {isIdling && <span className="badge badge-success" style={{ marginLeft: 'auto' }}>AKTİF</span>}
              </div>
              <IdlePanel
                state={state}
                games={allGames}
                selectedGames={selectedGames}
                onToggle={handleToggleGame}
                onStartIdle={handleStartIdle}
                onStopIdle={handleStopIdle}
              />
            </div>
          )}
        </div>

        {/* Right */}
        <div className="right-col">
          {isConnected ? (
            <div className="card fade-in">
              <div className="card-title">
                <span className="card-title-icon">🕹️</span>
                Oyun Listesi
                <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>
                  {selectedGames.length} seçili
                </span>
              </div>
              {allGames.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon">📋</span>
                  <div className="empty-state-title">Oyun listesi yükleniyor...</div>
                  <p>Hesabınızdaki oyunlar Steam'den alınıyor.</p>
                </div>
              ) : (
                <GameSelector games={allGames} selectedGames={selectedGames} onToggle={handleToggleGame} />
              )}
              <AddGameForm onAdded={g => setExtraGames(prev => [...prev, g])} />
            </div>
          ) : (
            <div className="card fade-in">
              <div className="empty-state" style={{ padding: '80px 24px' }}>
                <span className="empty-state-icon">🎮</span>
                <div className="empty-state-title">
                  {hasSavedAccounts
                    ? 'Hesabınızı seçin veya yeni giriş yapın'
                    : 'Steam Hesabınıza Giriş Yapın'
                  }
                </div>
                <p>
                  {hasSavedAccounts
                    ? 'Sol taraftan kayıtlı hesabınıza tek tıkla giriş yapabilirsiniz.'
                    : 'Sol taraftaki formu kullanarak giriş yapın.\nİlk girişten sonra şifre tekrar sorulmaz.'
                  }
                </p>
              </div>
            </div>
          )}
          {isConnected && <IdleHistory refreshKey={historyKey} />}
        </div>
      </main>

      <footer className="footer">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Developed with
          <span style={{ color: '#ff4f6d' }}>❤️</span>
          <a
            href="https://github.com/nazimparlak"
            target="_blank"
            rel="noreferrer"
            style={{ fontWeight: 700, color: '#ffffff', textDecoration: 'none', textShadow: '0 0 8px rgba(255,255,255,0.5)', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <svg height="15" width="15" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            nzmprlk
          </a>
        </span>
      </footer>
    </div>
  )
}
