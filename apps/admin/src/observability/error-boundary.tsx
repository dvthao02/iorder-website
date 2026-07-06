import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class AdminErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error(error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="admin-shell" role="alert">
          <section className="admin-card">
            <h1>Khong tai duoc CMS</h1>
            <p>He thong da ghi nhan loi. Vui long tai lai trang sau it phut.</p>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
