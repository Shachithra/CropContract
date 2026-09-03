import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cc_user') || 'null')
    } catch {
      return null
    }
  })

  useEffect(() => {
    const onExpired = () => setUser(null)
    const onUpdated = () => {
      try {
        setUser(JSON.parse(localStorage.getItem('cc_user') || 'null'))
      } catch {
        setUser(null)
      }
    }
    window.addEventListener('cc_auth_expired', onExpired)
    window.addEventListener('cc_user_updated', onUpdated)
    return () => {
      window.removeEventListener('cc_auth_expired', onExpired)
      window.removeEventListener('cc_user_updated', onUpdated)
    }
  }, [])

  const login = useCallback(async (api, email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('cc_token', data.access_token)
    localStorage.setItem('cc_user', JSON.stringify(data.user))
    setUser(data.user)
    window.dispatchEvent(new Event('cc_user_updated'))
    return data.user
  }, [])

  const register = useCallback(async (api, body) => {
    const { data } = await api.post('/auth/register', body)
    localStorage.setItem('cc_token', data.access_token)
    localStorage.setItem('cc_user', JSON.stringify(data.user))
    setUser(data.user)
    window.dispatchEvent(new Event('cc_user_updated'))
    return data.user
  }, [])

  const verifyOtp = useCallback(async (api, phone, otp) => {
    const { data } = await api.post('/auth/verify-otp', { phone, otp })
    localStorage.setItem('cc_token', data.access_token)
    localStorage.setItem('cc_user', JSON.stringify(data.user))
    setUser(data.user)
    window.dispatchEvent(new Event('cc_user_updated'))
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cc_token')
    localStorage.removeItem('cc_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export function homePathFor(role) {
  if (role === 'farmer') return '/farmer'
  if (role === 'buyer') return '/buyer'
  if (role === 'officer') return '/officer'
  return '/login'
}
