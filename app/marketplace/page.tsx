'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase-client'
import { Search, Star, Filter } from 'lucide-react'
import { motion } from 'framer-motion'

const categories = [
  'All',
  'Music & Audio',
  'Design',
  'Writing',
  'Photography',
  'Video',
  'Programming',
  'Marketing',
  'Consulting',
]

// Mock data - In production, fetch from Supabase
const mockListings = [
  {
    id: '1',
    title: 'Professional Logo Design',
    description: 'Custom logo design for your ministry or business',
    category: 'Design',
    price_min: 500,
    price_max: 2000,
    seller_id: '1',
    seller_name: 'Sarah Johnson',
    rating: 4.9,
    reviews: 142,
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    title: 'Full-Stack Web Development',
    description: 'Build your ministry website with modern technologies',
    category: 'Programming',
    price_min: 3000,
    price_max: 10000,
    seller_id: '2',
    seller_name: 'Michael Chen',
    rating: 4.95,
    reviews: 198,
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    title: 'Content Writing & Copywriting',
    description: 'Engaging content for your blog, website, or campaigns',
    category: 'Writing',
    price_min: 1000,
    price_max: 5000,
    seller_id: '3',
    seller_name: 'Emma Rodriguez',
    rating: 4.8,
    reviews: 87,
    image: 'https://images.unsplash.com/photo-1455165814004-2b7618e266d8?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    title: 'Professional Photography',
    description: 'Event, product, and portrait photography services',
    category: 'Photography',
    price_min: 800,
    price_max: 3000,
    seller_id: '4',
    seller_name: 'David Park',
    rating: 4.7,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1516035069371-29a08fb8d101?w=400&h=300&fit=crop',
  },
  {
    id: '5',
    title: 'Video Editing & Production',
    description: 'Professional video editing for YouTube, events, and promotions',
    category: 'Video',
    price_min: 1500,
    price_max: 6000,
    seller_id: '5',
    seller_name: 'Lisa Thompson',
    rating: 4.85,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=400&h=300&fit=crop',
  },
  {
    id: '6',
    title: 'Music Composition & Production',
    description: 'Original music for worship, events, and media',
    category: 'Music & Audio',
    price_min: 2000,
    price_max: 8000,
    seller_id: '6',
    seller_name: 'James Wilson',
    rating: 4.9,
    reviews: 98,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
  },
]

export default function Marketplace() {
  const [listings, setListings] = useState(mockListings)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(false)

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(search.toLowerCase()) ||
      listing.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      selectedCategory === 'All' || listing.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className='min-h-screen py-12'>
      {/* Search & Filter Section */}
      <div className='bg-gradient-to-br from-primary/5 to-secondary/5 border-b border-border sticky top-16 z-40'>
        <div className='container mx-auto px-4 py-8'>
          <div className='space-y-6'>
            {/* Search Bar */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5' />
              <Input
                placeholder='Search by skill, service, or creator...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-10 h-12 text-base'
              />
            </div>

            {/* Categories */}
            <div className='flex gap-2 overflow-x-auto pb-2'>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border border-border hover:border-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Results count */}
            <p className='text-sm text-muted-foreground'>
              Showing {filteredListings.length} creator{filteredListings.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className='container mx-auto px-4 py-12'>
        {filteredListings.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-muted-foreground mb-4'>No creators found matching your criteria</p>
            <Button variant='outline' onClick={() => { setSearch(''); setSelectedCategory('All'); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredListings.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link href={`/listing/${listing.id}`}>
                  <Card className='hover:shadow-lg transition-all cursor-pointer overflow-hidden h-full'>
                    {/* Image */}
                    <div className='h-48 bg-muted overflow-hidden'>
                      <img
                        src={listing.image}
                        alt={listing.title}
                        className='w-full h-full object-cover hover:scale-105 transition-transform'
                      />
                    </div>

                    <CardContent className='p-6'>
                      {/* Category Badge */}
                      <Badge variant='secondary' className='mb-3'>
                        {listing.category}
                      </Badge>

                      {/* Title */}
                      <h3 className='font-semibold text-lg mb-2 line-clamp-2'>
                        {listing.title}
                      </h3>

                      {/* Description */}
                      <p className='text-sm text-muted-foreground mb-4 line-clamp-2'>
                        {listing.description}
                      </p>

                      {/* Seller & Rating */}
                      <div className='flex items-center justify-between mb-4'>
                        <p className='text-sm font-medium'>{listing.seller_name}</p>
                        <div className='flex items-center gap-1'>
                          <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                          <span className='text-sm font-semibold'>{listing.rating}</span>
                          <span className='text-xs text-muted-foreground'>
                            ({listing.reviews})
                          </span>
                        </div>
                      </div>

                      {/* Price Range */}
                      <div className='flex items-center justify-between pt-4 border-t border-border'>
                        <span className='text-primary font-bold'>
                          ${listing.price_min.toLocaleString()} - ${listing.price_max.toLocaleString()}
                        </span>
                        <Button size='sm' variant='outline'>
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
