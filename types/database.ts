export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'buyer' | 'seller' | 'admin'
          created_at: string
          updated_at: string
          is_banned: boolean
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'buyer' | 'seller' | 'admin'
          created_at?: string
          updated_at?: string
          is_banned?: boolean
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'buyer' | 'seller' | 'admin'
          created_at?: string
          updated_at?: string
          is_banned?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          bio: string | null
          skills: string[] | null
          social_links: Json | null
          profile_photo_url: string | null
          is_seller: boolean
          rating: number
          reviews_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bio?: string | null
          skills?: string[] | null
          social_links?: Json | null
          profile_photo_url?: string | null
          is_seller?: boolean
          rating?: number
          reviews_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bio?: string | null
          skills?: string[] | null
          social_links?: Json | null
          profile_photo_url?: string | null
          is_seller?: boolean
          rating?: number
          reviews_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          id: string
          seller_id: string
          title: string
          description: string
          category: string
          price_min: number
          price_max: number
          delivery_days: number
          images: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          title: string
          description: string
          category: string
          price_min: number
          price_max: number
          delivery_days: number
          images?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          title?: string
          description?: string
          category?: string
          price_min?: number
          price_max?: number
          delivery_days?: number
          images?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          created_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          buyer_id: string
          seller_id: string
          order_id: string | null
          listing_id: string | null
          last_message_id: string | null
          last_message_at: string | null
          status: 'active' | 'archived' | 'hired'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          seller_id: string
          order_id?: string | null
          listing_id?: string | null
          last_message_id?: string | null
          last_message_at?: string | null
          status?: 'active' | 'archived' | 'hired'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string
          seller_id?: string
          order_id?: string | null
          listing_id?: string | null
          last_message_id?: string | null
          last_message_at?: string | null
          status?: 'active' | 'archived' | 'hired'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          available_balance: number
          pending_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          available_balance?: number
          pending_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          available_balance?: number
          pending_balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          id: string
          seller_id: string
          listing_id: string | null
          title: string
          description: string
          price: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          listing_id?: string | null
          title: string
          description: string
          price: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          listing_id?: string | null
          title?: string
          description?: string
          price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          receiver_id: string
          message: string
          message_type: 'TEXT' | 'IMAGE' | 'FILE' | 'DELIVERABLE' | 'SYSTEM'
          attachment_url: string | null
          attachment_type: string | null
          attachment_name: string | null
          attachment_size: number | null
          status: 'SENT' | 'DELIVERED' | 'READ'
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          receiver_id: string
          message: string
          message_type?: 'TEXT' | 'IMAGE' | 'FILE' | 'DELIVERABLE' | 'SYSTEM'
          attachment_url?: string | null
          attachment_type?: string | null
          attachment_name?: string | null
          attachment_size?: number | null
          status?: 'SENT' | 'DELIVERED' | 'READ'
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          receiver_id?: string
          message?: string
          message_type?: 'TEXT' | 'IMAGE' | 'FILE' | 'DELIVERABLE' | 'SYSTEM'
          attachment_url?: string | null
          attachment_type?: string | null
          attachment_name?: string | null
          attachment_size?: number | null
          status?: 'SENT' | 'DELIVERED' | 'READ'
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          user_id: string
          read_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          read_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          read_at?: string
        }
        Relationships: []
      }
      typing_status: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          is_typing: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          is_typing?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          is_typing?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          user_id: string
          is_online: boolean
          last_seen: string
          updated_at: string
        }
        Insert: {
          user_id: string
          is_online?: boolean
          last_seen?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          is_online?: boolean
          last_seen?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          buyer_id: string
          seller_id: string
          service_id: string | null
          listing_id: string | null
          title: string
          amount: number
          escrow_fee_percent: number
          escrow_fee_amount: number
          seller_earnings: number
          payment_status: 'PENDING' | 'PAID' | 'REFUNDED'
          order_status:
            | 'PENDING_PAYMENT'
            | 'ACTIVE'
            | 'DELIVERED'
            | 'REVISION_REQUESTED'
            | 'COMPLETED'
            | 'CANCELLED'
            | 'DISPUTED'
          status: 'pending' | 'active' | 'delivered' | 'revision_requested' | 'completed' | 'cancelled'
          total_amount: number
          due_at: string | null
          delivered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          seller_id: string
          service_id?: string | null
          listing_id?: string | null
          title: string
          amount?: number
          escrow_fee_percent?: number
          escrow_fee_amount?: number
          seller_earnings?: number
          payment_status?: 'PENDING' | 'PAID' | 'REFUNDED'
          order_status?:
            | 'PENDING_PAYMENT'
            | 'ACTIVE'
            | 'DELIVERED'
            | 'REVISION_REQUESTED'
            | 'COMPLETED'
            | 'CANCELLED'
            | 'DISPUTED'
          status?: 'pending' | 'active' | 'delivered' | 'revision_requested' | 'completed' | 'cancelled'
          total_amount?: number
          due_at?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string
          seller_id?: string
          service_id?: string | null
          listing_id?: string | null
          title?: string
          amount?: number
          escrow_fee_percent?: number
          escrow_fee_amount?: number
          seller_earnings?: number
          payment_status?: 'PENDING' | 'PAID' | 'REFUNDED'
          order_status?:
            | 'PENDING_PAYMENT'
            | 'ACTIVE'
            | 'DELIVERED'
            | 'REVISION_REQUESTED'
            | 'COMPLETED'
            | 'CANCELLED'
            | 'DISPUTED'
          status?: 'pending' | 'active' | 'delivered' | 'revision_requested' | 'completed' | 'cancelled'
          total_amount?: number
          due_at?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          user_id: string | null
          order_id: string | null
          type: 'PAYMENT' | 'ESCROW_HOLD' | 'RELEASE' | 'WITHDRAWAL' | 'REFUND' | 'FEE'
          amount: number
          status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED'
          reference: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          order_id?: string | null
          type: 'PAYMENT' | 'ESCROW_HOLD' | 'RELEASE' | 'WITHDRAWAL' | 'REFUND' | 'FEE'
          amount: number
          status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED'
          reference: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          order_id?: string | null
          type?: 'PAYMENT' | 'ESCROW_HOLD' | 'RELEASE' | 'WITHDRAWAL' | 'REFUND' | 'FEE'
          amount?: number
          status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED'
          reference?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          id: string
          user_id: string
          amount: number
          status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
          bank_name: string
          account_name: string
          account_number: string
          admin_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
          bank_name: string
          account_name: string
          account_number: string
          admin_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
          bank_name?: string
          account_name?: string
          account_number?: string
          admin_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      deliverables: {
        Row: {
          id: string
          order_id: string
          seller_id: string
          message: string
          file_url: string | null
          file_name: string | null
          delivered_at: string
        }
        Insert: {
          id?: string
          order_id: string
          seller_id: string
          message: string
          file_url?: string | null
          file_name?: string | null
          delivered_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          seller_id?: string
          message?: string
          file_url?: string | null
          file_name?: string | null
          delivered_at?: string
        }
        Relationships: []
      }
      platform_revenue: {
        Row: {
          id: string
          order_id: string | null
          amount: number
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          amount: number
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          amount?: number
          source?: string
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          actor_id: string | null
          conversation_id: string | null
          order_id: string | null
          type: 'NEW_MESSAGE' | 'ORDER_DELIVERY' | 'REVISION_REQUEST' | 'PAYMENT_CONFIRMATION'
          title: string
          body: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          actor_id?: string | null
          conversation_id?: string | null
          order_id?: string | null
          type: 'NEW_MESSAGE' | 'ORDER_DELIVERY' | 'REVISION_REQUEST' | 'PAYMENT_CONFIRMATION'
          title: string
          body: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          actor_id?: string | null
          conversation_id?: string | null
          order_id?: string | null
          type?: 'NEW_MESSAGE' | 'ORDER_DELIVERY' | 'REVISION_REQUEST' | 'PAYMENT_CONFIRMATION'
          title?: string
          body?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          listing_id: string
          buyer_id: string
          seller_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          buyer_id: string
          seller_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          buyer_id?: string
          seller_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      get_or_create_conversation: {
        Args: {
          target_buyer_id: string
          target_seller_id: string
          target_order_id?: string | null
          target_listing_id?: string | null
        }
        Returns: string
      }
      create_marketplace_order: {
        Args: { target_service_id: string }
        Returns: string
      }
      confirm_simulated_payment: {
        Args: { target_order_id: string }
        Returns: string
      }
      deliver_marketplace_order: {
        Args: {
          target_order_id: string
          delivery_message: string
          delivery_file_url?: string | null
          delivery_file_name?: string | null
        }
        Returns: string
      }
      accept_marketplace_delivery: {
        Args: { target_order_id: string }
        Returns: string
      }
      request_order_revision: {
        Args: {
          target_order_id: string
          revision_message: string
        }
        Returns: string
      }
      request_withdrawal: {
        Args: {
          withdrawal_amount: number
          target_bank_name: string
          target_account_name: string
          target_account_number: string
        }
        Returns: string
      }
      approve_withdrawal: {
        Args: {
          target_withdrawal_id: string
          mark_paid?: boolean
        }
        Returns: string
      }
      reject_withdrawal: {
        Args: {
          target_withdrawal_id: string
          rejection_note?: string | null
        }
        Returns: string
      }
      ensure_wallet: {
        Args: { target_user_id: string }
        Returns: string
      }
      seed_services_from_listings: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      user_role: 'buyer' | 'seller' | 'admin'
      conversation_status: 'active' | 'archived' | 'hired'
      message_type: 'TEXT' | 'IMAGE' | 'FILE' | 'DELIVERABLE' | 'SYSTEM'
      message_status: 'SENT' | 'DELIVERED' | 'READ'
      order_status: 'pending' | 'active' | 'delivered' | 'revision_requested' | 'completed' | 'cancelled'
      payment_status: 'PENDING' | 'PAID' | 'REFUNDED'
      marketplace_order_status:
        | 'PENDING_PAYMENT'
        | 'ACTIVE'
        | 'DELIVERED'
        | 'REVISION_REQUESTED'
        | 'COMPLETED'
        | 'CANCELLED'
        | 'DISPUTED'
      transaction_type: 'PAYMENT' | 'ESCROW_HOLD' | 'RELEASE' | 'WITHDRAWAL' | 'REFUND' | 'FEE'
      transaction_status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED'
      withdrawal_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
      notification_type: 'NEW_MESSAGE' | 'ORDER_DELIVERY' | 'REVISION_REQUEST' | 'PAYMENT_CONFIRMATION'
    }
  }
}
