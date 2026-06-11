import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Loader2 } from 'lucide-react'

export default function AuthRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center">
        <Loader2 size={40} className="text-emerald-500 animate-spin mb-4" />
        <p className="text-gray-400">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    )
  }

  if (!session) {
    // Redirect to login if there is no session
    return <Navigate to="/login" replace />
  }

  // If authenticated, render the child routes (the AdminLayout)
  return <Outlet />
}
