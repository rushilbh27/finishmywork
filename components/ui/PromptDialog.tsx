'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { LockClosedIcon, XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

interface PromptDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (value: string) => void
  title: string
  message: string
  placeholder?: string
  inputType?: 'text' | 'password' | 'email'
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  required?: boolean
}

export default function PromptDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  placeholder = '',
  inputType = 'text',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  required = true
}: PromptDialogProps) {
  const [value, setValue] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (required && !value.trim()) return
    onConfirm(value)
    setValue('') // Reset value after submit
  }

  const handleClose = () => {
    setValue('')
    onClose()
  }

  const inputDisplayType = inputType === 'password' && showPassword ? 'text' : inputType

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 p-6 text-left align-middle shadow-2xl transition-all">
                <form onSubmit={handleSubmit}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <LockClosedIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    
                    <div className="flex-grow">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                      >
                        {title}
                      </Dialog.Title>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {message}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-200 flex items-center justify-center"
                    >
                      <XMarkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>

                  <div className="mb-6">
                    <div className="relative">
                      <input
                        type={inputDisplayType}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-white dark:bg-white/5 backdrop-blur-xl text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-white/20 px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-blue-500/50 dark:focus:border-blue-400/50 focus:bg-white dark:focus:bg-white/10 transition-all duration-200 placeholder:text-gray-500 dark:placeholder:text-gray-300"
                        required={required}
                        autoFocus
                      />
                      {inputType === 'password' && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                        >
                          {showPassword ? (
                            <EyeSlashIcon className="w-5 h-5" />
                          ) : (
                            <EyeIcon className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelText}
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || (required && !value.trim())}
                      className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      )}
                      {confirmText}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}