import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, Mail, User, Shield } from 'lucide-react'
import PageTransition from '../components/PageTransition'

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    navigate('/auth')
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const initial = profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'

  return (
    <PageTransition>
      <div className="min-h-screen p-4 max-w-md mx-auto pt-8">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 mb-8">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full border-2 border-gray-200 dark:border-gray-700 object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-3xl">
              {initial}
            </div>
          )}
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {profile?.full_name || 'User'}
            </h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Info Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-4" style={{ backgroundColor: 'var(--card)' }}>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <User size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">ชื่อ</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{profile?.full_name || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <Mail size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">อีเมล</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <Shield size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">สถานะบัญชี</p>
              <p className="text-sm font-medium text-emerald-500">ยืนยันแล้ว</p>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-200 dark:border-red-900 text-red-500 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </PageTransition>
  )
}
