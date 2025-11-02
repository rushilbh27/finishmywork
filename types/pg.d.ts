declare module 'pg' {
  export class Client {
    constructor(config?: any)
    connect(): Promise<void>
    query(sql: string, params?: any[]): Promise<any>
    end(): Promise<void>
    on(event: string, cb: (...args: any[]) => void): void
  }
  export type Notification = any
}
