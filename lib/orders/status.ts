type ViewerRole = 'buyer' | 'seller' | 'admin' | 'participant'

const orderLabels: Record<string, string> = {
  PENDING_PAYMENT: 'Awaiting payment confirmation',
  ACTIVE: 'In progress',
  DELIVERED: 'Delivered for buyer review',
  REVISION_REQUESTED: 'Revision requested',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTED: 'In dispute',
}

const paymentLabels: Record<string, string> = {
  PENDING: 'Payment pending',
  PAID: 'Payment confirmed',
  REFUNDED: 'Refunded',
}

const withdrawalLabels: Record<string, string> = {
  PENDING: 'Awaiting admin review',
  APPROVED: 'Approved for payout',
  REJECTED: 'Rejected',
  PAID: 'Paid',
}

export function orderStatusLabel(status: string) {
  return orderLabels[status] || status.replace(/_/g, ' ').toLowerCase()
}

export function paymentStatusLabel(status: string) {
  return paymentLabels[status] || status.replace(/_/g, ' ').toLowerCase()
}

export function withdrawalStatusLabel(status: string) {
  return withdrawalLabels[status] || status.replace(/_/g, ' ').toLowerCase()
}

export function orderNextStep(status: string, role: ViewerRole) {
  switch (status) {
    case 'PENDING_PAYMENT':
      if (role === 'buyer') return 'Your action: confirm payment to start the order.'
      if (role === 'seller') return 'Waiting on the buyer or admin to confirm payment.'
      if (role === 'admin') return 'Admin can confirm paid if provider/buyer confirmation is stuck.'
      return 'Waiting for payment confirmation.'
    case 'ACTIVE':
      if (role === 'seller') return 'Your action: deliver the work when ready.'
      if (role === 'buyer') return 'Waiting on the seller to deliver the work.'
      return 'Seller is expected to deliver the work.'
    case 'DELIVERED':
      if (role === 'buyer') return 'Your action: accept delivery or request a revision.'
      if (role === 'seller') return 'Waiting on the buyer to accept delivery or request revision.'
      return 'Buyer review is required.'
    case 'REVISION_REQUESTED':
      if (role === 'seller') return 'Your action: submit the revised delivery.'
      if (role === 'buyer') return 'Waiting on the seller to submit revisions.'
      return 'Seller revision is required.'
    case 'COMPLETED':
      if (role === 'buyer') return 'Order complete. You can leave a verified review.'
      if (role === 'seller') return 'Order complete. Earnings move from pending after acceptance rules.'
      return 'Order complete.'
    case 'CANCELLED':
      return 'Order cancelled.'
    case 'DISPUTED':
      if (role === 'admin') return 'Admin review is required to resolve this dispute.'
      return 'Admin review is required.'
    default:
      return 'Workflow status needs review.'
  }
}

export function orderStatusTone(status: string) {
  if (['PAID', 'ACTIVE', 'COMPLETED', 'APPROVED'].includes(status)) return 'bg-[#dcfce7] text-[#166534]'
  if (['DELIVERED', 'PENDING', 'PENDING_PAYMENT', 'REVISION_REQUESTED'].includes(status)) return 'bg-[#fef3c7] text-[#92400e]'
  if (['REJECTED', 'CANCELLED', 'DISPUTED', 'REFUNDED'].includes(status)) return 'bg-[#fee2e2] text-[#991b1b]'
  return 'bg-[#e5e7eb] text-[#374151]'
}
