type HookHandler = (data: unknown) => Promise<void> | void

export class HookManager {
  private handlers: Map<string, HookHandler[]> = new Map()

  register(event: string, handler: HookHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, [])
    }
    this.handlers.get(event)!.push(handler)
  }

  async emit(event: string, data: unknown): Promise<void> {
    const eventHandlers = this.handlers.get(event) ?? []
    await Promise.all(eventHandlers.map((handler) => Promise.resolve(handler(data))))
  }

  clear(): void {
    this.handlers.clear()
  }
}
