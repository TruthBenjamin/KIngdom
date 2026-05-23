export type PaymentIntent = {
  orderId: string
  amount: number
  currency: 'USD'
  provider: 'simulated'
  reference: string
}

export type PaymentConfirmation = {
  orderId: string
  provider: 'simulated'
  reference: string
  paid: boolean
}

export interface PaymentGateway {
  createIntent(input: { orderId: string; amount: number }): Promise<PaymentIntent>
  confirm(input: { orderId: string; reference: string }): Promise<PaymentConfirmation>
}

export class SimulatedPaymentGateway implements PaymentGateway {
  async createIntent(input: { orderId: string; amount: number }): Promise<PaymentIntent> {
    return {
      orderId: input.orderId,
      amount: input.amount,
      currency: 'USD',
      provider: 'simulated',
      reference: `SIM-${input.orderId}`,
    }
  }

  async confirm(input: { orderId: string; reference: string }): Promise<PaymentConfirmation> {
    return {
      orderId: input.orderId,
      provider: 'simulated',
      reference: input.reference,
      paid: true,
    }
  }
}

export const paymentGateway = new SimulatedPaymentGateway()

