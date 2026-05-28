export type PaymentIntent = {
  orderId: string
  amount: number
  currency: 'USD'
  provider: 'beta'
  reference: string
}

export type PaymentConfirmation = {
  orderId: string
  provider: 'beta'
  reference: string
  paid: boolean
}

export interface PaymentGateway {
  createIntent(input: { orderId: string; amount: number }): Promise<PaymentIntent>
  confirm(input: { orderId: string; reference: string }): Promise<PaymentConfirmation>
}

export class BetaPaymentGateway implements PaymentGateway {
  async createIntent(input: { orderId: string; amount: number }): Promise<PaymentIntent> {
    return {
      orderId: input.orderId,
      amount: input.amount,
      currency: 'USD',
      provider: 'beta',
      reference: `SIM-${input.orderId}`,
    }
  }

  async confirm(input: { orderId: string; reference: string }): Promise<PaymentConfirmation> {
    return {
      orderId: input.orderId,
      provider: 'beta',
      reference: input.reference,
      paid: true,
    }
  }
}

export const paymentGateway = new BetaPaymentGateway()
