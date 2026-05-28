import type { Database } from './database'

export type Json = Database['public']['Tables']['profiles']['Row']['social_links']
export type User = Database['public']['Tables']['users']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type UserRole = Database['public']['Tables']['users']['Row']['role']
