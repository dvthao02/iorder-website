import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'
type ToastItem = { id: number; type: ToastType; message: string }

let counter = 0
let items: ToastItem[] = []
const listeners = new Set<(next: ToastItem[]) => void>()

function emit() {
  for (const listener of listeners) listener(items)
}

function dismiss(id: number) {
  items = items.filter((item) => item.id !== id)
  emit()
}

function show(type: ToastType, message: string) {
  if (!message) return
  const id = (counter += 1)
  items = [...items, { id, type, message }]
  emit()
  window.setTimeout(() => dismiss(id), 3500)
}

/** Gọi từ bất kỳ đâu: toast.success('Đã lưu'), toast.error('Lỗi'). */
export const toast = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
  info: (message: string) => show('info', message),
}

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info }

/** Đặt một lần ở gốc app để hiển thị toast. */
export function ToastHost() {
  const [list, setList] = useState<ToastItem[]>(items)
  useEffect(() => {
    listeners.add(setList)
    return () => { listeners.delete(setList) }
  }, [])

  if (list.length === 0) return null
  return (
    <div className="toast-host" aria-live="polite" aria-atomic="false">
      {list.map((item) => {
        const Icon = ICONS[item.type]
        return (
          <div key={item.id} className={`toast toast-${item.type}`} role="status">
            <Icon size={18} className="toast-icon" />
            <span className="toast-msg">{item.message}</span>
            <button type="button" className="toast-close" aria-label="Đóng" onClick={() => dismiss(item.id)}><X size={14} /></button>
          </div>
        )
      })}
    </div>
  )
}
