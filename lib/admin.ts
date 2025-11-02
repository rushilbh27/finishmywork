import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/admin/login')
  }
  
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard') // Redirect non-admins to regular dashboard
  }
  
  return session
}