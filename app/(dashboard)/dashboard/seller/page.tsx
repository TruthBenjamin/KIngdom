'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  BarChart3,
  Bell,
  Briefcase,
  CalendarCheck,
  ChevronDown,
  CreditCard,
  Heart,
  Home,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Settings,
  Star,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const menu = [
  { label: 'Dashboard', icon: Home, active: true },
  { label: 'My Listings', icon: Briefcase },
  { label: 'Orders', icon: CalendarCheck },
  { label: 'Messages', icon: MessageCircle, count: 3, href: '/dashboard/messages' },
  { label: 'Reviews', icon: Star },
  { label: 'Earnings', icon: CreditCard, href: '/dashboard/payments' },
  { label: 'Saved Sellers', icon: Heart },
  { label: 'Profile', icon: User },
  { label: 'Settings', icon: Settings },
]

const stats = [
  ['Total Earnings', '$2,450', '+12% from last month'],
  ['Active Orders', '8', '+2 new orders'],
  ['Completed Orders', '56', '+8 this month'],
  ['Total Views', '1,230', '+15% from last month'],
]

const orders = [
  ['Church Conference Video', '$250', 'In Progress', 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=120&h=120&fit=crop'],
  ['Sermon Editing', '$120', 'In Progress', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=120&fit=crop'],
  ['Event Highlights', '$180', 'Delivered', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=120&h=120&fit=crop'],
  ['Promo Video', '$200', 'Delivered', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=120&h=120&fit=crop'],
]

const messages = [
  ['Grace A.', 'Hi Mark, I would like to discuss...', '2m', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop'],
  ['David E.', 'Thanks for the update!', '1h', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop'],
  ['Royal Hearts Church', 'Can you deliver by Friday?', '3h', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop'],
  ['Purpose Media', 'Project completed', '1d', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop'],
]

const chart = [28, 48, 45, 62, 58, 74, 68, 88, 78, 64, 56, 73]

export default function SellerDashboard() {
  return (
    <div className='min-h-screen bg-[#f7f3ec] px-3 py-3'>
      <div className='mx-auto grid max-w-[1500px] gap-3 lg:grid-cols-[250px_1fr_420px]'>
        <aside className='hidden min-h-[calc(100vh-96px)] rounded-lg bg-[#101828] p-5 text-white lg:flex lg:flex-col'>
          <Link href='/' className='mb-9 flex items-center gap-3'>
            <div className='grid h-10 w-10 place-items-center rounded-lg bg-[#d8952f] font-serif text-lg font-bold text-[#101828]'>
              K
            </div>
            <div>
              <p className='text-sm font-extrabold tracking-[0.14em]'>KINGDOM</p>
              <p className='text-[10px] uppercase tracking-[0.18em] text-white/55'>Marketplace</p>
            </div>
          </Link>

          <nav className='space-y-1'>
            {menu.map(({ label, icon: Icon, active, count, href }) => (
              <Link
                key={label}
                href={href || '/dashboard/seller'}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold transition ${
                  active ? 'bg-white/12 text-white' : 'text-white/68 hover:bg-white/8 hover:text-white'
                }`}
              >
                <span className='flex items-center gap-3'>
                  <Icon className='h-4 w-4' />
                  {label}
                </span>
                {count && (
                  <span className='rounded-full bg-[#d8952f] px-2 py-0.5 text-xs text-[#101828]'>{count}</span>
                )}
              </Link>
            ))}
          </nav>

          <button className='mt-auto flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-white/68 hover:bg-white/8 hover:text-white'>
            <LogOut className='h-4 w-4' />
            Log out
          </button>
        </aside>

        <main className='rounded-lg bg-white p-5 shadow-[0_18px_60px_rgba(33,24,10,0.08)] sm:p-8'>
          <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <h1 className='text-3xl font-extrabold'>Welcome back, Mark!</h1>
              <p className='mt-1 text-sm text-[#667085]'>
                Here is what is happening with your kingdom studio today.
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='icon' className='border-[#eadfce] bg-[#fffdf8]'>
                <Bell className='h-4 w-4' />
              </Button>
              <Button variant='outline' size='icon' className='border-[#eadfce] bg-[#fffdf8]'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </div>
          </div>

          <div className='mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            {stats.map(([label, value, delta]) => (
              <div key={label} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
                <p className='text-xs font-medium text-[#667085]'>{label}</p>
                <p className='mt-3 text-3xl font-extrabold'>{value}</p>
                <p className='mt-2 text-xs font-semibold text-[#15803d]'>{delta}</p>
              </div>
            ))}
          </div>

          <div className='grid gap-5 xl:grid-cols-[1.15fr_0.85fr]'>
            <section className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
              <div className='mb-5 flex items-center justify-between'>
                <div>
                  <h2 className='font-extrabold'>Earnings Overview</h2>
                  <p className='mt-1 text-xs text-[#667085]'>Bookings, retainers, and delivered edits.</p>
                </div>
                <button className='flex items-center gap-2 rounded-lg border border-[#eadfce] bg-white px-3 py-2 text-xs font-bold'>
                  This Month
                  <ChevronDown className='h-3 w-3' />
                </button>
              </div>
              <div className='relative h-72 rounded-lg bg-white p-4'>
                <div className='absolute inset-x-4 top-8 border-t border-[#edf0f2]' />
                <div className='absolute inset-x-4 top-24 border-t border-[#edf0f2]' />
                <div className='absolute inset-x-4 top-40 border-t border-[#edf0f2]' />
                <div className='absolute inset-x-4 top-56 border-t border-[#edf0f2]' />
                <svg viewBox='0 0 520 220' className='relative h-full w-full overflow-visible'>
                  <polyline
                    fill='none'
                    stroke='#193b8c'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='5'
                    points={chart
                      .map((value, index) => `${index * 47 + 8},${210 - value * 1.95}`)
                      .join(' ')}
                  />
                  {chart.map((value, index) => (
                    <circle
                      key={`${value}-${index}`}
                      cx={index * 47 + 8}
                      cy={210 - value * 1.95}
                      r='4'
                      fill='#193b8c'
                    />
                  ))}
                </svg>
                <div className='mt-2 grid grid-cols-4 text-xs text-[#98a2b3]'>
                  <span>May 1</span>
                  <span>May 7</span>
                  <span>May 14</span>
                  <span>May 28</span>
                </div>
              </div>
            </section>

            <section className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
              <div className='mb-5 flex items-center justify-between'>
                <h2 className='font-extrabold'>Recent Orders</h2>
                <button className='text-xs font-bold text-[#8a5a18]'>View all</button>
              </div>
              <div className='space-y-3'>
                {orders.map(([title, price, status, image]) => (
                  <div key={title} className='flex items-center gap-3 rounded-lg bg-white p-3'>
                    <Image
                      src={image}
                      alt=''
                      width={44}
                      height={44}
                      sizes='44px'
                      className='h-11 w-11 rounded-lg object-cover'
                    />
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-bold'>{title}</p>
                      <p className='text-[11px] uppercase tracking-wide text-[#98a2b3]'>Due soon</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-extrabold'>{price}</p>
                      <p
                        className={`text-xs font-bold ${
                          status === 'Delivered' ? 'text-[#15803d]' : 'text-[#b97822]'
                        }`}
                      >
                        {status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className='mt-5 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
            <div className='mb-5 flex items-center gap-2'>
              <BarChart3 className='h-5 w-5 text-[#b97822]' />
              <h2 className='font-extrabold'>Studio pulse</h2>
            </div>
            <div className='grid gap-4 md:grid-cols-3'>
              {[
                ['Best seller', 'Sermon recap edits are converting 22% higher this week.'],
                ['Client note', 'Three churches saved you for June conference work.'],
                ['Next move', 'Add one worship lyric video package to catch search traffic.'],
              ].map(([title, text]) => (
                <div key={title} className='rounded-lg bg-white p-4'>
                  <p className='font-bold'>{title}</p>
                  <p className='mt-2 text-sm leading-6 text-[#5b6472]'>{text}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className='rounded-lg bg-white shadow-[0_18px_60px_rgba(33,24,10,0.08)]'>
          <div className='border-b border-[#eadfce] p-5'>
            <h2 className='text-xl font-extrabold'>Messages</h2>
            <p className='mt-1 text-sm text-[#667085]'>Warm leads and active project threads.</p>
          </div>
          <div className='grid min-h-[720px] md:grid-cols-[180px_1fr] lg:grid-cols-1 xl:grid-cols-[180px_1fr]'>
            <div className='border-r border-[#eadfce] p-4 lg:border-r-0 xl:border-r'>
              <div className='mb-4 rounded-lg border border-[#eadfce] bg-[#fffdf8] px-3 py-2 text-xs text-[#98a2b3]'>
                Search messages...
              </div>
              <div className='space-y-2'>
                {messages.map(([name, preview, time, image], index) => (
                  <div
                    key={name}
                    className={`flex items-center gap-3 rounded-lg p-2 ${
                      index === 0 ? 'bg-[#f2eadc]' : 'hover:bg-[#fffdf8]'
                    }`}
                  >
                    <Image
                      src={image}
                      alt=''
                      width={40}
                      height={40}
                      sizes='40px'
                      className='h-10 w-10 rounded-full object-cover'
                    />
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center justify-between gap-2'>
                        <p className='truncate text-sm font-bold'>{name}</p>
                        <p className='text-[10px] text-[#98a2b3]'>{time}</p>
                      </div>
                      <p className='truncate text-xs text-[#667085]'>{preview}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='flex flex-col p-5'>
              <div className='mb-5 flex items-center justify-between border-b border-[#eadfce] pb-4'>
                <div className='flex items-center gap-3'>
                  <Image
                    src='https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop'
                    alt=''
                    width={44}
                    height={44}
                    sizes='44px'
                    className='h-11 w-11 rounded-full object-cover'
                  />
                  <div>
                    <p className='font-bold'>Grace A.</p>
                    <p className='text-xs text-[#15803d]'>Online</p>
                  </div>
                </div>
                <MoreHorizontal className='h-5 w-5 text-[#667085]' />
              </div>
              <div className='flex-1 space-y-4 text-sm'>
                <p className='w-fit max-w-[82%] rounded-lg bg-[#f1eee8] px-4 py-3'>
                  Hi Mark, I would like to discuss a project with you.
                </p>
                <p className='ml-auto w-fit max-w-[82%] rounded-lg bg-[#edbd68] px-4 py-3 text-[#1f2937]'>
                  Hello Grace. Sure, I would love to hear more about it.
                </p>
                <p className='w-fit max-w-[82%] rounded-lg bg-[#f1eee8] px-4 py-3'>
                  Great! It is for our upcoming church conference.
                </p>
                <div className='w-fit rounded-lg border border-[#eadfce] bg-[#fffdf8] px-4 py-3 text-xs font-semibold'>
                  Conference_Brief.pdf
                  <span className='ml-3 font-normal text-[#98a2b3]'>2.4 MB</span>
                </div>
                <p className='ml-auto w-fit max-w-[82%] rounded-lg bg-[#edbd68] px-4 py-3 text-[#1f2937]'>
                  Thanks. I will review it and get back to you shortly.
                </p>
              </div>
              <div className='mt-5 flex items-center gap-2 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-2'>
                <span className='flex-1 px-3 text-xs text-[#98a2b3]'>Type a message...</span>
                <Button size='sm' className='bg-[#101828] text-white hover:bg-[#1f2937]'>
                  Send
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
