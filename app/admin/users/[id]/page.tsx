import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'

export default async function AdminUserRedirect({ params }: { params: { id: string } }) {
  await requireAdmin()
  // Redirect to users list with a deep-link query that the dashboard uses to open the modal
  redirect(`/admin/users?viewUser=${encodeURIComponent(params.id)}`)
}
