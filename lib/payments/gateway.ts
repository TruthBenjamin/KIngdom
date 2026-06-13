export type PaymentMethod = 'beta_card' | 'loveworld_espees'
export type PaymentProvider = 'beta' | 'kingspay_gs' | 'espees'
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
    description: 'Pay through the hosted Espees payment portal.',
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
  raw?: unknown
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

type EspeesProductResponse = {
  statusCode?: number
  payment_ref?: string
  message?: string
  [key: string]: unknown
}

type EspeesConfirmResponse = {
  customer_username?: string
  product_sku?: string
  narration?: string
  price?: number
  transaction_status?: 'APPROVED' | 'DECLINE' | 'PENDING' | 'NOT FOUND' | string
  status_details?: string
  transaction_date?: string
  user_data?: unknown
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

function espeesApiBaseUrl() {
  return (process.env.ESPEES_API_URL || 'https://api.espees.org').replace(/\/$/, '')
}

function espeesPaymentBaseUrl() {
  return (process.env.ESPEES_PAYMENT_URL || 'https://payment.espees.org').replace(/\/$/, '')
}

function kingsPaySecret() {
  return process.env.KINGSPAY_GS_SECRET_KEY || process.env.KINGSPAY_SECRET_KEY || ''
}

function espeesApiKey() {
  return process.env.ESPEES_API_KEY || ''
}

function liveKingsPayEnabled(method: PaymentMethod) {
  return method === 'loveworld_espees' && process.env.KINGSPAY_GS_MODE === 'live' && Boolean(kingsPaySecret())
}

function liveEspeesEnabled(method: PaymentMethod) {
  return method === 'loveworld_espees' && process.env.ESPEES_MODE === 'live' && Boolean(espeesApiKey())
}

function amountToMinorUnits(amount: number) {
  return Math.max(1, Math.round(amount * 100))
}

function amountToEspees(amount: number) {
  const multiplier = Number(process.env.ESPEES_PRICE_MULTIPLIER || '1')
  const converted = amount * (Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1)
  return Math.max(0.01, Number(converted.toFixed(2)))
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

export class EspeesPaymentGateway extends KingsPayGsPaymentGateway {
  async createIntent(input: {
    orderId: string
    amount: number
    method?: PaymentMethod
    customerEmail?: string | null
  }): Promise<PaymentIntent> {
    const method = input.method || 'beta_card'

    if (!liveEspeesEnabled(method)) {
      return super.createIntent(input)
    }

    const merchantWallet = process.env.ESPEES_MERCHANT_WALLET || ''
    if (!merchantWallet) {
      throw new Error('Missing ESPEES_MERCHANT_WALLET for live Espees payments')
    }

    const reference = `KM-${input.orderId}`
    const callbackUrl = `${appUrl()}/api/payments/espees/callback?orderId=${encodeURIComponent(input.orderId)}`
    const response = await fetch(`${espeesApiBaseUrl()}/v2/payment/product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': espeesApiKey(),
      },
      body: JSON.stringify({
        product_sku: reference,
        narration: `Kingdom Marketplace order ${input.orderId}`,
        price: amountToEspees(input.amount),
        merchant_wallet: merchantWallet,
        success_url: `${callbackUrl}&result=success`,
        fail_url: `${callbackUrl}&result=failed`,
        user_data: {
          orderId: input.orderId,
          paymentMethod: method,
          marketplace: 'kingdom',
          customerEmail: input.customerEmail || null,
        },
      }),
    })

    const payload = (await response.json().catch(() => ({}))) as EspeesProductResponse
    if (!response.ok || payload.statusCode !== 200 || !payload.payment_ref) {
      throw new Error(payload.message || 'Could not initialize Espees payment')
    }

    return {
      orderId: input.orderId,
      amount: input.amount,
      currency: 'LWE',
      provider: 'espees',
      providerPaymentId: payload.payment_ref,
      reference,
      redirectUrl: `${espeesPaymentBaseUrl()}/pay/${encodeURIComponent(payload.payment_ref)}`,
      method,
      raw: payload,
    }
  }

  async confirm(input: {
    orderId: string
    reference: string
    method?: PaymentMethod
    providerPaymentId?: string | null
  }): Promise<PaymentConfirmation> {
    if (!input.providerPaymentId || !liveEspeesEnabled(input.method || 'loveworld_espees')) {
      return super.confirm(input)
    }

    const response = await fetch(`${espeesApiBaseUrl()}/v2/payment/confirm/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': espeesApiKey(),
      },
      body: JSON.stringify({
        payment_ref: input.providerPaymentId,
      }),
    })
    const payload = (await response.json().catch(() => ({}))) as EspeesConfirmResponse

    if (!response.ok) {
      throw new Error(payload.status_details || 'Could not verify Espees payment')
    }

    const status = String(payload.transaction_status || '').toUpperCase()
    return {
      orderId: input.orderId,
      provider: 'espees',
      providerPaymentId: input.providerPaymentId,
      reference: input.providerPaymentId,
      method: input.method || 'loveworld_espees',
      paid: status === 'APPROVED',
      raw: payload,
    }
  }
}

export const paymentGateway = new EspeesPaymentGateway()
