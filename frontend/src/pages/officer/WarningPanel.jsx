import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, User, Shield, Search, X, ChevronDown } from 'lucide-react'
import Button from '../../components/common/Button.jsx'
import Card from '../../components/common/Card.jsx'
import Chip from '../../components/common/Chip.jsx'
import api from '../../lib/api.js'
import { showToast } from '../../components/common/Toast.jsx'

const warningSchema = z.object({
  target_user_id: z.string().min(1, 'Select a user'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(500),
  violation_type: z.string().min(1, 'Select a violation type'),
})

const VIOLATION_TYPES = {
  farmer: [
    { value: 'disease_report', label: 'Disease report issue' },
    { value: 'pricing', label: 'Pricing violation' },
    { value: 'contract_breach', label: 'Contract breach' },
    { value: 'quality', label: 'Quality issue' },
    { value: 'conduct', label: 'Conduct violation' },
    { value: 'other', label: 'Other' },
  ],
  buyer: [
    { value: 'pricing', label: 'Pricing violation' },
    { value: 'contract_breach', label: 'Contract breach' },
    { value: 'payment', label: 'Payment issue' },
    { value: 'delivery', label: 'Delivery issue' },
    { value: 'conduct', label: 'Conduct violation' },
    { value: 'other', label: 'Other' },
  ],
}

export default function WarningPanel() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [roleFilter, setRoleFilter] = useState('farmer')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef(null)
  const dropdownRef = useRef(null)

  const { data: warnings = [], isLoading } = useQuery({
    queryKey: ['all-warnings'],
    queryFn: async () => (await api.get('/warnings/all')).data,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['search-users', roleFilter, searchQuery],
    queryFn: async () => {
      const params = { role: roleFilter }
      if (searchQuery) params.q = searchQuery
      const { data } = await api.get('/auth/users/search', { params })
      return data
    },
    enabled: showForm,
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(warningSchema),
    defaultValues: {
      target_user_id: '',
      reason: '',
      violation_type: '',
    },
  })

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectUser(user) {
    setSelectedUser(user)
    setValue('target_user_id', user.user_id || user.id, { shouldValidate: true })
    setSearchQuery('')
    setShowDropdown(false)
  }

  function clearUser() {
    setSelectedUser(null)
    setValue('target_user_id', '', { shouldValidate: true })
    setValue('violation_type', '', { shouldValidate: true })
    setSearchQuery('')
  }

  async function onSubmit(data) {
    setLoading(true)
    try {
      await api.post('/warnings', data)
      queryClient.invalidateQueries({ queryKey: ['all-warnings'] })
      showToast(t('warning.warningIssued'), 'success')
      reset()
      setSelectedUser(null)
      setSearchQuery('')
      setShowForm(false)
    } catch (err) {
      const detail = err.response?.data?.detail
      showToast(typeof detail === 'string' ? detail : t('common.error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  function openForm() {
    setShowForm(true)
    setSelectedUser(null)
    setSearchQuery('')
  }

  // Group warnings by target user
  const warningsByUser = warnings.reduce((acc, w) => {
    if (!acc[w.target_user_id]) {
      acc[w.target_user_id] = {
        user_id: w.target_user_id,
        user_name: w.target_user_name,
        user_role: w.target_user_role,
        warnings: [],
        total_warnings: 0,
      }
    }
    acc[w.target_user_id].warnings.push(w)
    acc[w.target_user_id].total_warnings = Math.max(acc[w.target_user_id].total_warnings, w.warning_number)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-paddy">{t('warning.title')}</h1>
          <p className="text-text-muted text-sm mt-0.5">Issue warnings and manage user compliance</p>
        </div>
        <button
          onClick={openForm}
          className="btn-primary !rounded-xl flex items-center gap-2"
        >
          <AlertTriangle size={16} />
          {t('warning.issueWarning')}
        </button>
      </div>

      {/* Issue Warning Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="space-y-4">
              {/* Role filter tabs */}
              <div>
                <label className="label-muted mb-2 block">{t('warning.targetUser')}</label>
                <div className="flex gap-2 mb-3">
                  {['farmer', 'buyer'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => { setRoleFilter(role); clearUser() }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                        roleFilter === role
                          ? 'bg-paddy text-white'
                          : 'bg-cream border border-surface-border text-text-muted hover:border-paddy/30'
                      }`}
                    >
                      {role === 'farmer' ? '🌾 Farmers' : '🏪 Buyers'}
                    </button>
                  ))}
                </div>

                {/* Search / ID input */}
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      ref={searchRef}
                      type="text"
                      className="input-field pl-10 pr-10"
                      placeholder={roleFilter === 'farmer' ? 'Search FRM-001, name, or phone...' : 'Search BUY-001, name, or phone...'}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setShowDropdown(true)
                        if (selectedUser) clearUser()
                      }}
                      onFocus={() => setShowDropdown(true)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => { setSearchQuery(''); setShowDropdown(false) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-paddy"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {showDropdown && users.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute z-20 w-full mt-1 bg-white border border-surface-border rounded-xl shadow-lg max-h-60 overflow-y-auto"
                      >
                        {users.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => selectUser(u)}
                            className="w-full px-4 py-3 text-left hover:bg-cream transition flex items-center gap-3 border-b border-surface-border last:border-0"
                          >
                            <div className="w-9 h-9 rounded-full bg-paddy/10 grid place-items-center shrink-0">
                              <User size={16} className="text-paddy" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-paddy text-sm truncate">{u.name}</p>
                              <p className="text-xs text-text-muted truncate">
                                {u.user_id} · {u.phone || 'No phone'} · {u.region}
                              </p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {showDropdown && searchQuery && users.length === 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-surface-border rounded-xl shadow-lg px-4 py-6 text-center">
                      <p className="text-text-muted text-sm">No users found</p>
                    </div>
                  )}
                </div>

                {errors.target_user_id && <p className="text-clay text-xs mt-1">{errors.target_user_id.message}</p>}
              </div>

              {/* Selected user profile card */}
              <AnimatePresence>
                {selectedUser && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="bg-paddy/5 border border-paddy/20 rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-paddy/15 grid place-items-center">
                            <User size={20} className="text-paddy" />
                          </div>
                          <div>
                            <p className="font-display font-bold text-paddy">{selectedUser.name}</p>
                            <p className="text-xs text-text-muted">{selectedUser.user_id}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearUser}
                          className="text-text-muted hover:text-clay transition"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-text-muted">Phone:</span>{' '}
                          <span className="font-medium text-paddy">{selectedUser.phone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-text-muted">Email:</span>{' '}
                          <span className="font-medium text-paddy truncate block">{selectedUser.email}</span>
                        </div>
                        <div>
                          <span className="text-text-muted">Region:</span>{' '}
                          <span className="font-medium text-paddy">{selectedUser.region}</span>
                        </div>
                        <div>
                          <span className="text-text-muted">Role:</span>{' '}
                          <span className="font-medium text-paddy capitalize">{selectedUser.role}</span>
                        </div>
                        {selectedUser.role === 'farmer' && selectedUser.farm_location && (
                          <div className="col-span-2">
                            <span className="text-text-muted">Farm:</span>{' '}
                            <span className="font-medium text-paddy">{selectedUser.farm_location}</span>
                          </div>
                        )}
                        {selectedUser.role === 'buyer' && selectedUser.company_name && (
                          <div className="col-span-2">
                            <span className="text-text-muted">Company:</span>{' '}
                            <span className="font-medium text-paddy">{selectedUser.company_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="label-muted">{t('warning.violationType')}</label>
                <select className={`input-field ${errors.violation_type ? 'border-clay' : ''}`} {...register('violation_type')}>
                  <option value="">Select violation type</option>
                  {VIOLATION_TYPES[roleFilter].map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
                {errors.violation_type && <p className="text-clay text-xs mt-1">{errors.violation_type.message}</p>}
              </div>

              <div>
                <label className="label-muted">{t('warning.reason')}</label>
                <textarea
                  rows={3}
                  className={`input-field ${errors.reason ? 'border-clay' : ''}`}
                  placeholder="Describe the violation..."
                  {...register('reason')}
                />
                {errors.reason && <p className="text-clay text-xs mt-1">{errors.reason.message}</p>}
              </div>

              <div className="bg-turmeric/10 border border-turmeric/30 rounded-xl px-4 py-3">
                <p className="text-xs text-turmeric">
                  <strong>Warning progression:</strong> 3 warnings → 7-day ban → 3 more warnings → permanent ban
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setShowForm(false); reset(); clearUser() }} className="flex-1">
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSubmit(onSubmit)} loading={loading} variant="danger" className="flex-1">
                  {t('warning.issueWarning')}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warnings by User */}
      {isLoading ? (
        <p className="text-text-muted text-sm py-10 text-center">{t('common.loading')}</p>
      ) : Object.keys(warningsByUser).length === 0 ? (
        <Card className="text-center py-12">
          <Shield size={28} className="mx-auto mb-2 text-paddy/30" />
          <p className="text-text-muted text-sm">{t('warning.noWarnings')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {Object.values(warningsByUser).map((user, i) => (
            <motion.div
              key={user.user_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-paddy/10 grid place-items-center">
                      <User size={18} className="text-paddy" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-paddy">{user.user_name}</p>
                      <p className="text-xs text-text-muted">{user.user_role} · {user.user_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      user.total_warnings >= 3 ? 'bg-clay/15 text-clay' :
                      user.total_warnings >= 2 ? 'bg-turmeric/15 text-turmeric' :
                      'bg-teal/15 text-teal'
                    }`}>
                      {user.total_warnings} warning(s)
                    </span>
                  </div>
                </div>

                {/* Warning history */}
                <div className="space-y-2">
                  {user.warnings.slice(0, 3).map((w) => (
                    <div key={w.id} className="bg-cream border border-surface-border rounded-xl px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-paddy">
                          Warning #{w.warning_number}
                        </span>
                        <span className="text-[11px] text-text-muted">{w.issued_at}</span>
                      </div>
                      <p className="text-xs text-text-muted mt-1">{w.reason}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Chip tone="open">{w.violation_type}</Chip>
                        <span className="text-[11px] text-text-muted">by {w.issued_by_name}</span>
                      </div>
                    </div>
                  ))}
                  {user.warnings.length > 3 && (
                    <p className="text-xs text-text-muted text-center">
                      +{user.warnings.length - 3} more warnings
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Back to dashboard */}
      <button
        onClick={() => navigate('/officer')}
        className="text-sm font-semibold text-paddy underline underline-offset-2 hover:text-turmeric transition"
      >
        ← Back to Dashboard
      </button>
    </div>
  )
}
