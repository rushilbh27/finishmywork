import { redirect } from 'next/navigation'

interface Params {
  params: { taskId: string }
}

export default function LegacyMessagesRedirect({ params }: Params) {
  const id = Number.parseInt(params.taskId, 10)
  if (Number.isNaN(id)) {
    redirect('/messages')
  }
  redirect(`/messages?taskId=${id}`)
}
