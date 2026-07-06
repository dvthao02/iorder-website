import { useState } from 'react'

// Ảnh placeholder (SVG data URI) hiện khi ảnh gốc lỗi/thiếu — nền xám nhạt + icon ảnh.
const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%23eef4f8'/%3E%3Cg fill='none' stroke='%23b6c7d6' stroke-width='9' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='292' y='150' width='216' height='160' rx='14'/%3E%3Ccircle cx='345' cy='200' r='20'/%3E%3Cpath d='M300 300l60-58 42 42 38-32 60 48'/%3E%3C/g%3E%3C/svg%3E"

export default function SafeImage({ src, alt = '', ...rest }) {
  const [errored, setErrored] = useState(false)
  const finalSrc = errored || !src ? PLACEHOLDER : src
  return (
    <img
      src={finalSrc}
      alt={alt}
      onError={() => {
        if (!errored) setErrored(true)
      }}
      {...rest}
    />
  )
}
