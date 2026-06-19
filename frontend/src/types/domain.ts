export type UserRole = 'admin' | 'player'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
  status: 'active' | 'suspended'
}

export interface WalletSummary {
  balance: number
  locked_balance: number
  notice: string
}
