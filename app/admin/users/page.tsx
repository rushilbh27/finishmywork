export const dynamic = "force-dynamic"

import { requireAdmin } from '@/lib/admin'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default async function AdminUsersPage() {
  await requireAdmin()
  return <AdminDashboard />
}
