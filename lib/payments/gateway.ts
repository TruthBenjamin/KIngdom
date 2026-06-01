export type PaymentMethod = 'beta_card' | 'loveworld_espees'

export const paymentMethods: {
  id: PaymentMethod
  label: string
  description: string
  currencyLabel: string
}[] = [
  {
    id: 'loveworld_espees',
    label: 'Loveworld Espees',
    description: 'Use Espees as the preferred marketplace payment option for this order.',
    currencyLabel: 'LWE',
  },
  {
    id: 'beta_card',
    label: 'Beta card record',
    description: 'Use the current simulated card payment record while live rails are in beta.',
    currencyLabel: 'USD',
  },
]

export type PaymentIntent = {
  orderId: string
  amount: number
  currency: 'USD' | 'LWE'
  provider: 'beta'
  reference: string
  method: PaymentMethod
}

export type PaymentConfirmation = {
  orderId: string
  provider: 'beta'
  reference: string
  method: PaymentMethod
  paid: boolean
}

export interface PaymentGateway {
  createIntent(input: { orderId: string; amount: number; method?: PaymentMethod }): Promise<PaymentIntent>
  confirm(input: { orderId: string; reference: string; method?: PaymentMethod }): Promise<PaymentConfirmation>
}

export class BetaPaymentGateway implements PaymentGateway {
  async createIntent(input: { orderId: string; amount: number; method?: PaymentMethod }): Promise<PaymentIntent> {
    const method = input.method || 'beta_card'
    return {
      orderId: input.orderId,
      amount: input.amount,
      currency: method === 'loveworld_espees' ? 'LWE' : 'USD',
      provider: 'beta',
      reference: `${method === 'loveworld_espees' ? 'LWE' : 'SIM'}-${input.orderId}`,
      method,
    }
  }

  async confirm(input: { orderId: string; reference: string; method?: PaymentMethod }): Promise<PaymentConfirmation> {
    return {
      orderId: input.orderId,
      provider: 'beta',
      reference: input.reference,
      method: input.method || 'beta_card',
      paid: true,
    }
  }
}

export const paymentGateway = new BetaPaymentGateway()
