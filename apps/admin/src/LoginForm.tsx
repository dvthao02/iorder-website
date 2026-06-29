import { useState, type FormEvent } from 'react'

interface LoginFormProps {
  isSubmitting: boolean
  onSubmit: (username: string, password: string) => Promise<void>
}

export function LoginForm({ isSubmitting, onSubmit }: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit(username, password)
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label htmlFor="cms-username">Tên đăng nhập</label>
      <input
        id="cms-username"
        type="text"
        autoComplete="username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        required
      />

      <label htmlFor="cms-password">Mật khẩu</label>
      <input
        id="cms-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập CMS'}
      </button>
    </form>
  )
}
