import { redirect } from 'next/navigation'

export default function MarketplaceCategoryPage({ params }: { params: { category: string } }) {
  redirect(`/marketplace?category=${params.category}`)
}
