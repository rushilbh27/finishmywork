'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      icon: 'text-red-300',
      iconBg: 'bg-red-500/20',
      button: 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30',
      border: 'border-red-500/20'
    },
    warning: {
      icon: 'text-yellow-300',
      iconBg: 'bg-yellow-500/20',
      button: 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30',
      border: 'border-yellow-500/20'
    },
    info: {
      icon: 'text-purple-300',
      iconBg: 'bg-purple-500/20',
      button: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30',
      border: 'border-purple-500/20'
    }
  }

  const styles = variantStyles[variant]

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`w-full max-w-md transform overflow-hidden rounded-2xl bg-card/85 backdrop-blur-2xl border border-border/60 ${styles.border} p-6 text-left align-middle shadow-card transition-all`}>
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 ${styles.iconBg} rounded-xl flex items-center justify-center border ${styles.border}`}>
                    <ExclamationTriangleIcon className={`w-6 h-6 ${styles.icon}`} />
                  </div>
                  
                  <div className="flex-grow">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold text-foreground mb-2"
                    >
                      {title}
                    </Dialog.Title>
                    <p className="text-sm text-muted-foreground">
                      {message}
                    </p>
                  </div>

                  <button
                    onClick={onClose}
                    className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-white/5 transition-colors duration-200 flex items-center justify-center"
                  >
                    <XMarkIcon className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground bg-white/5 hover:bg-white/10 border border-border/60 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`px-4 py-2 text-sm font-medium ${styles.button} rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                  >
                    {isLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    )}
                    {confirmText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}