export interface IDB {
    connect(): Promise<void>
    disconnect(): Promise<void>
}