export const dynamic = "force-dynamic"

import { requireAdmin } from '@/lib/admin'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default async function AdminDashboardPage() {
  await requireAdmin() // This will redirect if not admin
  
  return <AdminDashboard />
}