export type PaymentMethod = 'beta_card' | 'loveworld_espees'
export type PaymentProvider = 'beta' | 'kingspay_gs'
export type PaymentCurrency = 'USD' | 'LWE'

export const paymentMethods: {
  id: PaymentMethod
  label: string
  description: string
  currencyLabel: string
}[] = [
  {
    id: 'loveworld_espees',
    label: 'Loveworld Espees',
    description: 'Pay through the KingsPay Goods & Services hosted Espees checkout.',
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
  currency: PaymentCurrency
  provider: PaymentProvider
  providerPaymentId?: string | null
  reference: string
  redirectUrl?: string | null
  method: PaymentMethod
}

export type PaymentConfirmation = {
  orderId: string
  provider: PaymentProvider
  providerPaymentId?: string | null
  reference: string
  method: PaymentMethod
  paid: boolean
  raw?: unknown
}

export interface PaymentGateway {
  createIntent(input: {
    orderId: string
    amount: number
    method?: PaymentMethod
    customerEmail?: string | null
  }): Promise<PaymentIntent>
  confirm(input: {
    orderId: string
    reference: string
    method?: PaymentMethod
    providerPaymentId?: string | null
  }): Promise<PaymentConfirmation>
}

type KingsPayInitializeResponse = {
  status?: string
  data?: {
    id?: string
    payment_id?: string
    authorization_url?: string
    checkout_url?: string
    payment_url?: string
  }
  message?: string
  [key: string]: unknown
}

type KingsPayVerifyResponse = {
  status?: string
  data?: {
    id?: string
    payment_id?: string
    status?: string
    amount?: number
    currency?: string
    reference?: string
    metadata?: unknown
  }
  message?: string
  [key: string]: unknown
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')
}

function apiBaseUrl() {
  return (process.env.KINGSPAY_GS_API_URL || 'https://api.kingspay-gs.com').replace(/\/$/, '')
}

function checkoutBaseUrl() {
  return (process.env.KINGSPAY_GS_CHECKOUT_URL || 'https://kingspay-gs.com').replace(/\/$/, '')
}

function kingsPaySecret() {
  return process.env.KINGSPAY_GS_SECRET_KEY || process.env.KINGSPAY_SECRET_KEY || ''
}

function liveKingsPayEnabled(method: PaymentMethod) {
  return method === 'loveworld_espees' && process.env.KINGSPAY_GS_MODE === 'live' && Boolean(kingsPaySecret())
}

function amountToMinorUnits(amount: number) {
  return Math.max(1, Math.round(amount * 100))
}

function parseProviderPaymentId(response: KingsPayInitializeResponse) {
  return response.data?.payment_id || response.data?.id || String(response.payment_id || response.id || '')
}

function parseCheckoutUrl(response: KingsPayInitializeResponse, providerPaymentId: string) {
  return (
    response.data?.authorization_url ||
    response.data?.checkout_url ||
    response.data?.payment_url ||
    (providerPaymentId ? `${checkoutBaseUrl()}/payment?id=${encodeURIComponent(providerPaymentId)}` : null)
  )
}

function verifiedPaymentStatus(response: KingsPayVerifyResponse) {
  return String(response.data?.status || response.status || '').toLowerCase()
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

export class KingsPayGsPaymentGateway extends BetaPaymentGateway {
  async createIntent(input: {
    orderId: string
    amount: number
    method?: PaymentMethod
    customerEmail?: string | null
  }): Promise<PaymentIntent> {
    const method = input.method || 'beta_card'

    if (!liveKingsPayEnabled(method)) {
      return super.createIntent(input)
    }

    const callbackUrl = `${appUrl()}/api/payments/kingspay/callback?orderId=${encodeURIComponent(input.orderId)}`
    const webhookUrl = `${appUrl()}/api/payments/kingspay/webhook`
    const reference = `LWE-${input.orderId}`
    const response = await fetch(`${apiBaseUrl()}/api/payment/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kingsPaySecret()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountToMinorUnits(input.amount),
        currency: 'ESP',
        reference,
        description: `Kingdom Marketplace order ${input.orderId}`,
        customer_email: input.customerEmail || undefined,
        merchant_callback_url: callbackUrl,
        callback_url: callbackUrl,
        webhook_url: webhookUrl,
        metadata: {
          orderId: input.orderId,
          paymentMethod: method,
          marketplace: 'kingdom',
        },
      }),
    })

    const payload = (await response.json().catch(() => ({}))) as KingsPayInitializeResponse
    if (!response.ok) {
      throw new Error(payload.message || 'Could not initialize Espees payment')
    }

    const providerPaymentId = parseProviderPaymentId(payload)
    const redirectUrl = parseCheckoutUrl(payload, providerPaymentId)

    if (!providerPaymentId || !redirectUrl) {
      throw new Error('Espees payment initialization did not return a payment URL')
    }

    return {
      orderId: input.orderId,
      amount: input.amount,
      currency: 'LWE',
      provider: 'kingspay_gs',
      providerPaymentId,
      reference,
      redirectUrl,
      method,
    }
  }

  async confirm(input: {
    orderId: string
    reference: string
    method?: PaymentMethod
    providerPaymentId?: string | null
  }): Promise<PaymentConfirmation> {
    if (!input.providerPaymentId) {
      return super.confirm(input)
    }

    const response = await fetch(`${apiBaseUrl()}/api/payment/${encodeURIComponent(input.providerPaymentId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${kingsPaySecret()}`,
        'Content-Type': 'application/json',
      },
    })
    const payload = (await response.json().catch(() => ({}))) as KingsPayVerifyResponse

    if (!response.ok) {
      throw new Error(payload.message || 'Could not verify Espees payment')
    }

    const status = verifiedPaymentStatus(payload)
    return {
      orderId: input.orderId,
      provider: 'kingspay_gs',
      providerPaymentId: input.providerPaymentId,
      reference: payload.data?.reference || input.reference,
      method: input.method || 'loveworld_espees',
      paid: ['paid', 'success', 'successful', 'completed'].includes(status),
      raw: payload,
    }
  }
}

export const paymentGateway = new KingsPayGsPaymentGateway()
