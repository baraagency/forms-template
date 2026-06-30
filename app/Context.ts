type Context = {
  example?: boolean
  debugState?: string
  context?: string
  account: {
    domain: string
    id: number
    owner: {
      name: string
      email: string
    }
  }
  person: {
    id: number
    firstName?: string
    lastName?: string
    emails?: Array<{
      value: string
      type: string
      status: string
      isPrimary: number
    }>
    phones?: Array<{
      value: string
      normalized: string
      type: string
      status: string
      isPrimary: number
    }>
    stage?: {
      id: number
      name: string
    }
  }
  user?: {
    id: number
    name: string
    email: string
  }
}

export default Context
