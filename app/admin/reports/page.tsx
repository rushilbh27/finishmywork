'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Flag, User, FileText, Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft, Ban, Shield, Mail } from 'lucide-react'
import { format } from 'date-fns'

interface Report {
  id: string
  type: string
  category: string
  reason: string
  status: string
  action?: string | null
  notes?: string | null
  createdAt: string
  reviewedAt?: string | null
  reporter: {
    id: string
    name: string
    email: string
    avatar?: string | null
  }
  reported?: {
    id: string
    name: string
    email: string
    avatar?: string | null
    isSuspended: boolean
  } | null
  task?: {
    id: string
    title: string
    description: string
  } | null
  reviewer?: {
    id: string
    name: string
  } | null
}

interface BlockInfo {
  id: string
  blockerId: string
  blockedId: string
  reason?: string | null
  createdAt: string
  blocker: {
    id: string
    name: string
    email: string
  }
  blocked: {
    id: string
    name: string
    email: string
  }
}

export default function AdminReportsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [reports, setReports] = useState<Report[]>([])
  const [blocks, setBlocks] = useState<BlockInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('reports')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [actionNotes, setActionNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [emailType, setEmailType] = useState<string>('WARNING')

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports()
    } else if (activeTab === 'blocks') {
      fetchBlocks()
    }
  }, [activeTab])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/reports')
      if (!res.ok) {
        throw new Error('Failed to fetch reports')
      }
      const data = await res.json()
      setReports(data)
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast({
        title: 'Error',
        description: 'Failed to load reports',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchBlocks = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/blocks')
      if (!res.ok) {
        throw new Error('Failed to fetch blocks')
      }
      const data = await res.json()
      setBlocks(data)
    } catch (error) {
      console.error('Error fetching blocks:', error)
      toast({
        title: 'Error',
        description: 'Failed to load blocked users',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (reportId: string, status: string, action?: string) => {
    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          action,
          notes: actionNotes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update report')
      }

      toast({
        title: 'Success',
        description: data.message,
      })

      setSelectedReport(null)
      setActionNotes('')
      fetchReports()
    } catch (error) {
      console.error('Error updating report:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update report',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleSendEmail = async (reportId: string, userId: string, userEmail: string, selectedEmailType: string) => {
    setSendingEmail(reportId)
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail, emailType: selectedEmailType }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      toast({
        title: 'Email Sent',
        description: `Notification sent to ${userEmail}`,
      })
    } catch (error) {
      console.error('Error sending email:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send email',
        variant: 'destructive',
      })
    } finally {
      setSendingEmail(null)
    }
  }

  const handleSendBlockEmail = async (blockId: string, userId: string, userEmail: string, userName: string) => {
    setSendingEmail(blockId)
    try {
      const res = await fetch(`/api/admin/blocks/${blockId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail, userName }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      toast({
        title: 'Email Sent',
        description: `Notification sent to ${userEmail}`,
      })
    } catch (error) {
      console.error('Error sending email:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send email',
        variant: 'destructive',
      })
    } finally {
      setSendingEmail(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDING: 'destructive',
      REVIEWING: 'secondary',
      RESOLVED: 'default',
      DISMISSED: 'outline',
    }
    const colors: Record<string, string> = {
      PENDING: 'bg-red-500/10 text-red-400 border-red-500/20',
      REVIEWING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      RESOLVED: 'bg-green-500/10 text-green-400 border-green-500/20',
      DISMISSED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    }
    return (
      <Badge className={`${colors[status] || ''} border`}>
        {status}
      </Badge>
    )
  }

  const filteredReports = reports.filter((report) => {
    if (statusFilter === 'all') return true
    return report.status === statusFilter
  })

  if (loading && reports.length === 0 && blocks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-400" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Shield className="h-7 w-7 text-purple-400" />
                Moderation Center
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Review reports, manage blocks, and moderate user behavior
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="reports" className="gap-2">
              <Flag className="h-4 w-4" />
              Reports ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="blocks" className="gap-2">
              <Ban className="h-4 w-4" />
              Blocks ({blocks.length})
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card className="border-border/60 bg-card/85 backdrop-blur-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Filter Reports</CardTitle>
                    <CardDescription>View reports by status</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={statusFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter('all')}
                    >
                      All ({reports.length})
                    </Button>
                    <Button
                      variant={statusFilter === 'PENDING' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter('PENDING')}
                    >
                      Pending ({reports.filter(r => r.status === 'PENDING').length})
                    </Button>
                    <Button
                      variant={statusFilter === 'REVIEWING' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter('REVIEWING')}
                    >
                      Reviewing ({reports.filter(r => r.status === 'REVIEWING').length})
                    </Button>
                    <Button
                      variant={statusFilter === 'RESOLVED' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter('RESOLVED')}
                    >
                      Resolved ({reports.filter(r => r.status === 'RESOLVED').length})
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {filteredReports.length === 0 ? (
              <Card className="border-border/60 bg-card/85 backdrop-blur-2xl">
                <CardContent className="py-12 text-center">
                  <Flag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No reports found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="border-border/60 bg-card/85 backdrop-blur-2xl hover:border-purple-500/30 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            {report.type === 'USER' ? (
                              <User className="h-5 w-5 text-blue-400" />
                            ) : (
                              <FileText className="h-5 w-5 text-purple-400" />
                            )}
                            <CardTitle className="text-lg">
                              {report.type} Report: {report.category}
                            </CardTitle>
                            {getStatusBadge(report.status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">Reporter:</span>
                                <Link 
                                  href={`/users/${report.reporter.id}`}
                                  className="text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                  {report.reporter.name}
                                </Link>
                                <span className="text-muted-foreground text-xs">({report.reporter.email})</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                <Clock className="h-3 w-3" />
                                {format(new Date(report.createdAt), 'PPp')}
                              </div>
                            </div>
                            
                            {report.reported && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">Reported User:</span>
                                  <Link 
                                    href={`/users/${report.reported.id}`}
                                    className="text-purple-400 hover:text-purple-300 transition-colors"
                                  >
                                    {report.reported.name}
                                  </Link>
                                  {report.reported.isSuspended && (
                                    <Badge variant="destructive" className="text-xs">Suspended</Badge>
                                  )}
                                </div>
                                <span className="text-muted-foreground text-xs">{report.reported.email}</span>
                              </div>
                            )}

                            {report.task && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">Reported Task:</span>
                                  <Link 
                                    href={`/tasks/${report.task.id}`}
                                    className="text-purple-400 hover:text-purple-300 transition-colors truncate"
                                  >
                                    {report.task.title}
                                  </Link>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-surface/50 rounded-lg p-4 border border-border/40">
                        <p className="text-sm font-medium mb-2">Report Details:</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.reason}</p>
                      </div>

                      {report.reviewedAt && (
                        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                          <p className="text-sm font-medium text-green-400 mb-2">Review Details:</p>
                          <div className="space-y-2 text-sm">
                            <p className="text-muted-foreground">
                              Reviewed by {report.reviewer?.name || 'Unknown'} on{' '}
                              {format(new Date(report.reviewedAt), 'PPp')}
                            </p>
                            {report.action && (
                              <p className="text-foreground">Action taken: <span className="font-medium">{report.action}</span></p>
                            )}
                            {report.notes && (
                              <p className="text-muted-foreground">Notes: {report.notes}</p>
                            )}
                          </div>
                          {report.reported && report.status === 'RESOLVED' && (
                            <div className="mt-3 pt-3 border-t border-green-500/20 space-y-3">
                              <div>
                                <label className="text-xs font-medium text-muted-foreground mb-2 block">Email Template:</label>
                                <Select value={emailType} onValueChange={setEmailType}>
                                  <SelectTrigger className="w-full bg-surface/50 border-border/40">
                                    <SelectValue placeholder="Select template" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="WARNING">⚠️ Warning Issued</SelectItem>
                                    <SelectItem value="REPORT_RESOLVED">✅ Report Resolved</SelectItem>
                                    {report.action === 'SUSPEND_USER' && (
                                      <SelectItem value="SUSPENDED">🚫 Account Suspended (Auto-sent)</SelectItem>
                                    )}
                                    {report.action === 'DELETE_TASK' && (
                                      <SelectItem value="TASK_REMOVED">🗑️ Task Removed (Auto-sent)</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendEmail(report.id, report.reported!.id, report.reported!.email, emailType)}
                                disabled={sendingEmail === report.id}
                                className="gap-2 w-full"
                              >
                                <Mail className="h-4 w-4" />
                                {sendingEmail === report.id ? 'Sending...' : 'Send Notification Email'}
                              </Button>
                              {(report.action === 'SUSPEND_USER' || report.action === 'DELETE_TASK') && (
                                <p className="text-xs text-muted-foreground">
                                  Note: {report.action === 'SUSPEND_USER' ? 'Suspension' : 'Task deletion'} email was automatically sent when action was taken.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {report.status === 'PENDING' && (
                        <div className="flex gap-2 pt-4 border-t border-border/40">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleAction(report.id, 'REVIEWING')}
                            disabled={processing}
                            className="gap-2"
                          >
                            <AlertCircle className="h-4 w-4" />
                            Start Review
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(report.id, 'DISMISSED')}
                            disabled={processing}
                            className="gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            Dismiss
                          </Button>
                        </div>
                      )}

                      {report.status === 'REVIEWING' && (
                        <div className="space-y-3 pt-4 border-t border-border/40">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Action Notes:</label>
                            <Textarea
                              className="bg-surface/50 border-border/40"
                              rows={3}
                              placeholder="Add notes about your decision..."
                              value={actionNotes}
                              onChange={(e) => setActionNotes(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {report.type === 'USER' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleAction(report.id, 'RESOLVED', 'SUSPEND_USER')}
                                disabled={processing}
                              >
                                Suspend User
                              </Button>
                            )}
                            {report.type === 'TASK' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleAction(report.id, 'RESOLVED', 'DELETE_TASK')}
                                disabled={processing}
                              >
                                Delete Task
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleAction(report.id, 'RESOLVED', 'WARNING_ISSUED')}
                              disabled={processing}
                            >
                              Issue Warning
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(report.id, 'DISMISSED')}
                              disabled={processing}
                              className="gap-2"
                            >
                              <XCircle className="h-4 w-4" />
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Blocks Tab */}
          <TabsContent value="blocks" className="space-y-6">
            {blocks.length === 0 ? (
              <Card className="border-border/60 bg-card/85 backdrop-blur-2xl">
                <CardContent className="py-12 text-center">
                  <Ban className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No blocked users found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {blocks.map((block) => (
                  <Card key={block.id} className="border-border/60 bg-card/85 backdrop-blur-2xl">
                    <CardContent className="py-6">
                      <div className="flex items-start gap-6">
                        <Ban className="h-6 w-6 text-red-400 mt-1 flex-shrink-0" />
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Blocker</p>
                              <div className="flex items-center gap-2">
                                <Link 
                                  href={`/users/${block.blocker.id}`}
                                  className="font-semibold text-foreground hover:text-purple-400 transition-colors"
                                >
                                  {block.blocker.name}
                                </Link>
                              </div>
                              <p className="text-sm text-muted-foreground">{block.blocker.email}</p>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Blocked User</p>
                              <div className="flex items-center gap-2">
                                <Link 
                                  href={`/users/${block.blocked.id}`}
                                  className="font-semibold text-foreground hover:text-purple-400 transition-colors"
                                >
                                  {block.blocked.name}
                                </Link>
                              </div>
                              <p className="text-sm text-muted-foreground">{block.blocked.email}</p>
                            </div>
                          </div>

                          {block.reason && (
                            <div className="bg-surface/50 rounded-lg p-4 border border-border/40">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Reason</p>
                              <p className="text-sm text-foreground">{block.reason}</p>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Blocked on {format(new Date(block.createdAt), 'PPp')}
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendBlockEmail(block.id, block.blocker.id, block.blocker.email, block.blocker.name)}
                              disabled={sendingEmail === block.id}
                              className="gap-2"
                            >
                              <Mail className="h-4 w-4" />
                              {sendingEmail === block.id ? 'Sending...' : `Email ${block.blocker.name}`}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendBlockEmail(block.id + '-blocked', block.blocked.id, block.blocked.email, block.blocked.name)}
                              disabled={sendingEmail === block.id + '-blocked'}
                              className="gap-2"
                            >
                              <Mail className="h-4 w-4" />
                              {sendingEmail === block.id + '-blocked' ? 'Sending...' : `Email ${block.blocked.name}`}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
