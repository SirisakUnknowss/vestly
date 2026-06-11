import React from 'react'
import AdminSidebar from './AdminSidebar'
import { Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100 font-sans">
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto h-screen relative">
        <div className="p-6 md:p-8 max-w-6xl mx-auto pb-24">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
