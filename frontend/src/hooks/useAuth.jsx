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

  const [banInfo, setBanInfo] = useState(null)

  useEffect(() => {
    const onExpired = () => {
      setUser(null)
      setBanInfo(null)
    }
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

  const login = useCallback(async (api, phone, password) => {
    const { data } = await api.post('/auth/login', { phone, password })

    // Check if user is banned
    if (data.banned) {
      setBanInfo(data.ban_info)
      return { banned: true, banInfo: data.ban_info }
    }

    return { banned: false, phone: data.phone, role: data.role }
  }, [])

  const register = useCallback(async (api, body) => {
    const { data } = await api.post('/auth/register', body)

    // Check if registration was blocked by ban
    if (data.banned) {
      setBanInfo(data.ban_info)
      return { banned: true, banInfo: data.ban_info }
    }

    localStorage.setItem('cc_token', data.access_token)
    localStorage.setItem('cc_user', JSON.stringify(data.user))
    setUser(data.user)
    setBanInfo(null)
    window.dispatchEvent(new Event('cc_user_updated'))
    return data.user
  }, [])

  const verifyOtp = useCallback(async (api, phone, otp) => {
    const { data } = await api.post('/auth/verify-otp', { phone, otp })

    // Check if user is banned
    if (data.banned) {
      setBanInfo(data.ban_info)
      return { banned: true, banInfo: data.ban_info }
    }

    localStorage.setItem('cc_token', data.access_token)
    localStorage.setItem('cc_user', JSON.stringify(data.user))
    setUser(data.user)
    setBanInfo(null)
    window.dispatchEvent(new Event('cc_user_updated'))
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cc_token')
    localStorage.removeItem('cc_user')
    setUser(null)
    setBanInfo(null)
  }, [])

  const updateProfile = useCallback(async (api, body) => {
    const { data } = await api.put('/auth/profile', body)
    localStorage.setItem('cc_user', JSON.stringify(data))
    setUser(data)
    window.dispatchEvent(new Event('cc_user_updated'))
    return data
  }, [])

  const changePassword = useCallback(async (api, currentPassword, newPassword) => {
    const { data } = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
    return data
  }, [])

  return (
    <AuthContext.Provider value={{ user, banInfo, login, register, verifyOtp, logout, updateProfile, changePassword }}>
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
