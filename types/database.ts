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
          username: string | null
          profile_visibility: 'private' | 'marketplace' | 'public'
          role: 'buyer' | 'seller' | 'admin' | 'moderator'
          created_at: string
          updated_at: string
          is_banned: boolean
          moderation_status: 'active' | 'warned' | 'restricted' | 'banned'
          ban_reason: string | null
          risk_score: number
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          profile_visibility?: 'private' | 'marketplace' | 'public'
          role?: 'buyer' | 'seller' | 'admin' | 'moderator'
          created_at?: string
          updated_at?: string
          is_banned?: boolean
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          profile_visibility?: 'private' | 'marketplace' | 'public'
          role?: 'buyer' | 'seller' | 'admin' | 'moderator'
          created_at?: string
          updated_at?: string
          is_banned?: boolean
          moderation_status?: 'active' | 'warned' | 'restricted' | 'banned'
          ban_reason?: string | null
          risk_score?: number
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
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          is_active?: boolean
          sort_order?: number
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
          service_id: string | null
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
          service_id?: string | null
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
          service_id?: string | null
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
          title: string
          slug: string | null
          description: string
          category: string
          category_slug: string
          price: number
          delivery_days: number
          revision_count: number
          requirements: string | null
          media_url: string | null
          portfolio_urls: string[]
          package_summary: string | null
          cancellation_policy: string
          quality_score: number
          tags: string[]
          is_featured: boolean
          moderation_status: 'draft' | 'pending_review' | 'active' | 'paused' | 'rejected' | 'archived'
          status: 'draft' | 'active' | 'paused' | 'rejected'
          is_active: boolean
          takedown_reason: string | null
          moderated_by: string | null
          moderated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          title: string
          slug?: string | null
          description: string
          category?: string
          category_slug?: string
          price: number
          delivery_days?: number
          revision_count?: number
          requirements?: string | null
          media_url?: string | null
          portfolio_urls?: string[]
          package_summary?: string | null
          cancellation_policy?: string
          quality_score?: number
          tags?: string[]
          is_featured?: boolean
          moderation_status?: 'draft' | 'pending_review' | 'active' | 'paused' | 'rejected' | 'archived'
          status?: 'draft' | 'active' | 'paused' | 'rejected'
          is_active?: boolean
          takedown_reason?: string | null
          moderated_by?: string | null
          moderated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          title?: string
          slug?: string | null
          description?: string
          category?: string
          category_slug?: string
          price?: number
          delivery_days?: number
          revision_count?: number
          requirements?: string | null
          media_url?: string | null
          portfolio_urls?: string[]
          package_summary?: string | null
          cancellation_policy?: string
          quality_score?: number
          tags?: string[]
          is_featured?: boolean
          moderation_status?: 'draft' | 'pending_review' | 'active' | 'paused' | 'rejected' | 'archived'
          status?: 'draft' | 'active' | 'paused' | 'rejected'
          is_active?: boolean
          takedown_reason?: string | null
          moderated_by?: string | null
          moderated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      seller_profiles: {
        Row: {
          id: string
          user_id: string
          headline: string | null
          location: string | null
          response_time_minutes: number | null
          verification_status: 'unverified' | 'pending' | 'verified' | 'rejected'
          profile_completion_score: number
          is_accepting_orders: boolean
          category_specializations: string[]
          portfolio_urls: string[]
          verification_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          headline?: string | null
          location?: string | null
          response_time_minutes?: number | null
          verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected'
          profile_completion_score?: number
          is_accepting_orders?: boolean
          category_specializations?: string[]
          portfolio_urls?: string[]
          verification_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          headline?: string | null
          location?: string | null
          response_time_minutes?: number | null
          verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected'
          profile_completion_score?: number
          is_accepting_orders?: boolean
          category_specializations?: string[]
          portfolio_urls?: string[]
          verification_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      buyer_profiles: {
        Row: {
          id: string
          user_id: string
          organization_name: string | null
          buyer_type: 'individual' | 'church' | 'ministry' | 'business'
          project_interests: string[]
          default_project_brief: string | null
          verification_status: 'unverified' | 'pending' | 'verified' | 'rejected'
          profile_completion_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_name?: string | null
          buyer_type?: 'individual' | 'church' | 'ministry' | 'business'
          project_interests?: string[]
          default_project_brief?: string | null
          verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected'
          profile_completion_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_name?: string | null
          buyer_type?: 'individual' | 'church' | 'ministry' | 'business'
          project_interests?: string[]
          default_project_brief?: string | null
          verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected'
          profile_completion_score?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_services: {
        Row: {
          id: string
          user_id: string
          service_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          service_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          service_id?: string
          created_at?: string
        }
        Relationships: []
      }
      order_events: {
        Row: {
          id: string
          order_id: string
          actor_id: string | null
          event_type: string
          previous_status: string | null
          next_status: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          actor_id?: string | null
          event_type: string
          previous_status?: string | null
          next_status?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          actor_id?: string | null
          event_type?: string
          previous_status?: string | null
          next_status?: string | null
          metadata?: Json | null
          created_at?: string
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
          service_id: string
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
          buyer_requirements: string | null
          scope_confirmation: string | null
          terms_accepted_at: string | null
          cancellation_policy: string | null
          cancellation_reason: string | null
          dispute_reason: string | null
          revision_count: number
          accepted_at: string | null
          due_at: string | null
          delivered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          seller_id: string
          service_id: string
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
          buyer_requirements?: string | null
          scope_confirmation?: string | null
          terms_accepted_at?: string | null
          cancellation_policy?: string | null
          cancellation_reason?: string | null
          dispute_reason?: string | null
          revision_count?: number
          accepted_at?: string | null
          due_at?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string
          seller_id?: string
          service_id?: string
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
          buyer_requirements?: string | null
          scope_confirmation?: string | null
          terms_accepted_at?: string | null
          cancellation_policy?: string | null
          cancellation_reason?: string | null
          dispute_reason?: string | null
          revision_count?: number
          accepted_at?: string | null
          due_at?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_documents: {
        Row: {
          id: string
          order_id: string
          uploaded_by: string | null
          file_url: string
          file_name: string
          file_type: string | null
          file_size: number | null
          review_status: 'pending_review' | 'approved' | 'rejected'
          review_note: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          uploaded_by?: string | null
          file_url: string
          file_name: string
          file_type?: string | null
          file_size?: number | null
          review_status?: 'pending_review' | 'approved' | 'rejected'
          review_note?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          uploaded_by?: string | null
          file_url?: string
          file_name?: string
          file_type?: string | null
          file_size?: number | null
          review_status?: 'pending_review' | 'approved' | 'rejected'
          review_note?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
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
          type: 'NEW_MESSAGE' | 'ORDER_DELIVERY' | 'REVISION_REQUEST' | 'PAYMENT_CONFIRMATION' | 'SYSTEM_ALERT' | 'ABUSE_REPORT' | 'MODERATION_ACTION' | 'SELLER_VERIFICATION'
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
          type: 'NEW_MESSAGE' | 'ORDER_DELIVERY' | 'REVISION_REQUEST' | 'PAYMENT_CONFIRMATION' | 'SYSTEM_ALERT' | 'ABUSE_REPORT' | 'MODERATION_ACTION' | 'SELLER_VERIFICATION'
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
          type?: 'NEW_MESSAGE' | 'ORDER_DELIVERY' | 'REVISION_REQUEST' | 'PAYMENT_CONFIRMATION' | 'SYSTEM_ALERT' | 'ABUSE_REPORT' | 'MODERATION_ACTION' | 'SELLER_VERIFICATION'
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
          order_id: string
          service_id: string
          buyer_id: string
          seller_id: string
          rating: number
          comment: string | null
          status: 'published' | 'hidden' | 'flagged'
          moderation_note: string | null
          moderated_by: string | null
          moderated_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          service_id: string
          buyer_id: string
          seller_id: string
          rating: number
          comment?: string | null
          status?: 'published' | 'hidden' | 'flagged'
          moderation_note?: string | null
          moderated_by?: string | null
          moderated_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          service_id?: string
          buyer_id?: string
          seller_id?: string
          rating?: number
          comment?: string | null
          status?: 'published' | 'hidden' | 'flagged'
          moderation_note?: string | null
          moderated_by?: string | null
          moderated_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      abuse_reports: {
        Row: {
          id: string
          reporter_id: string | null
          target_type: 'user' | 'service' | 'review' | 'message' | 'order'
          target_id: string
          reason: string
          details: string | null
          status: 'open' | 'reviewing' | 'resolved' | 'dismissed'
          priority: 'low' | 'normal' | 'high' | 'urgent'
          assigned_admin_id: string | null
          resolution: string | null
          created_at: string
          updated_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          reporter_id?: string | null
          target_type: 'user' | 'service' | 'review' | 'message' | 'order'
          target_id: string
          reason: string
          details?: string | null
          status?: 'open' | 'reviewing' | 'resolved' | 'dismissed'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          assigned_admin_id?: string | null
          resolution?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          reporter_id?: string | null
          target_type?: 'user' | 'service' | 'review' | 'message' | 'order'
          target_id?: string
          reason?: string
          details?: string | null
          status?: 'open' | 'reviewing' | 'resolved' | 'dismissed'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          assigned_admin_id?: string | null
          resolution?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: { id: string; actor_id: string | null; action: string; target_type: string; target_id: string | null; metadata: Json; created_at: string }
        Insert: { id?: string; actor_id?: string | null; action: string; target_type: string; target_id?: string | null; metadata?: Json; created_at?: string }
        Update: { id?: string; actor_id?: string | null; action?: string; target_type?: string; target_id?: string | null; metadata?: Json; created_at?: string }
        Relationships: []
      }
      suspicious_activities: {
        Row: { id: string; user_id: string | null; activity_type: string; severity: 'low' | 'medium' | 'high' | 'critical'; metadata: Json; status: 'open' | 'reviewing' | 'resolved' | 'dismissed'; created_at: string; resolved_at: string | null }
        Insert: { id?: string; user_id?: string | null; activity_type: string; severity?: 'low' | 'medium' | 'high' | 'critical'; metadata?: Json; status?: 'open' | 'reviewing' | 'resolved' | 'dismissed'; created_at?: string; resolved_at?: string | null }
        Update: { id?: string; user_id?: string | null; activity_type?: string; severity?: 'low' | 'medium' | 'high' | 'critical'; metadata?: Json; status?: 'open' | 'reviewing' | 'resolved' | 'dismissed'; created_at?: string; resolved_at?: string | null }
        Relationships: []
      }
      manual_adjustments: {
        Row: { id: string; user_id: string | null; order_id: string | null; adjustment_type: 'refund_placeholder' | 'credit_placeholder' | 'debit_placeholder' | 'fee_correction'; amount: number; reason: string; status: 'recorded' | 'needs_provider_action' | 'completed' | 'voided'; created_by: string | null; created_at: string }
        Insert: { id?: string; user_id?: string | null; order_id?: string | null; adjustment_type: 'refund_placeholder' | 'credit_placeholder' | 'debit_placeholder' | 'fee_correction'; amount?: number; reason: string; status?: 'recorded' | 'needs_provider_action' | 'completed' | 'voided'; created_by?: string | null; created_at?: string }
        Update: { id?: string; user_id?: string | null; order_id?: string | null; adjustment_type?: 'refund_placeholder' | 'credit_placeholder' | 'debit_placeholder' | 'fee_correction'; amount?: number; reason?: string; status?: 'recorded' | 'needs_provider_action' | 'completed' | 'voided'; created_by?: string | null; created_at?: string }
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
          target_service_id?: string | null
        }
        Returns: string
      }
      marketplace_search_services: {
        Args: {
          search_query?: string | null
          target_category_slug?: string | null
          min_price?: number | null
          max_price?: number | null
          result_sort?: string | null
          result_limit?: number | null
          result_offset?: number | null
        }
        Returns: {
          service_id: string
          ranking_score: number
          total_count: number
        }[]
      }
      get_inbox_summaries: {
        Args: {
          result_limit?: number | null
          result_offset?: number | null
        }
        Returns: {
          id: string
          buyer_id: string
          seller_id: string
          order_id: string | null
          service_id: string | null
          status: string
          created_at: string
          updated_at: string
          last_message_at: string | null
          buyer: Json
          seller: Json
          order_summary: Json | null
          last_message: Json | null
          unread_count: number
          other_presence: Json | null
        }[]
      }
      mark_conversation_read: {
        Args: { target_conversation_id: string }
        Returns: number
      }
      send_conversation_message: {
        Args: {
          target_conversation_id: string
          body?: string | null
          target_message_type?: 'TEXT' | 'IMAGE' | 'FILE' | 'DELIVERABLE' | 'SYSTEM'
          target_attachment_url?: string | null
          target_attachment_type?: string | null
          target_attachment_name?: string | null
          target_attachment_size?: number | null
        }
        Returns: string
      }
      add_order_document: {
        Args: {
          target_order_id: string
          document_file_url: string
          document_file_name: string
          document_file_type?: string | null
          document_file_size?: number | null
        }
        Returns: string
      }
      admin_review_order_document: {
        Args: {
          target_document_id: string
          next_status: string
          note?: string | null
        }
        Returns: string
      }
      request_seller_verification: {
        Args: { note?: string | null }
        Returns: string
      }
      ensure_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      activate_seller_account: {
        Args: {
          seller_headline?: string | null
          seller_location?: string | null
          seller_response_time_minutes?: number | null
          seller_category_specializations?: string[] | null
          seller_portfolio_urls?: string[] | null
          seller_verification_note?: string | null
        }
        Returns: string
      }
      set_account_role: {
        Args: { next_role: 'buyer' | 'seller' }
        Returns: 'buyer' | 'seller'
      }
      upsert_buyer_profile: {
        Args: {
          buyer_display_name?: string | null
          buyer_organization_name?: string | null
          buyer_kind?: 'individual' | 'church' | 'ministry' | 'business' | null
          buyer_project_interests?: string[] | null
          buyer_default_project_brief?: string | null
        }
        Returns: string
      }
      set_saved_service: {
        Args: {
          target_service_id: string
          next_saved?: boolean | null
        }
        Returns: boolean
      }
      get_buyer_dashboard_summary: {
        Args: { result_limit?: number | null }
        Returns: {
          saved_services_count: number
          active_chats_count: number
          completed_orders_count: number
          total_spent: number
          saved_services: Json
        }[]
      }
      upsert_seller_profile: {
        Args: {
          seller_headline?: string | null
          seller_location?: string | null
          seller_response_time_minutes?: number | null
          seller_is_accepting_orders?: boolean | null
          seller_category_specializations?: string[] | null
          seller_portfolio_urls?: string[] | null
          seller_verification_note?: string | null
        }
        Returns: string
      }
      upsert_seller_service: {
        Args: {
          target_service_id?: string | null
          service_title?: string | null
          service_description?: string | null
          service_category?: string | null
          service_category_slug?: string | null
          service_price?: number | null
          service_delivery_days?: number | null
          service_revision_count?: number | null
          service_requirements?: string | null
          service_media_url?: string | null
          service_portfolio_urls?: string[] | null
          service_package_summary?: string | null
          service_cancellation_policy?: string | null
          service_tags?: string[] | null
          submit_for_review?: boolean | null
        }
        Returns: string
      }
      set_seller_service_visibility: {
        Args: {
          target_service_id: string
          next_is_active: boolean
        }
        Returns: string
      }
      submit_abuse_report: {
        Args: {
          target_kind: 'user' | 'service' | 'review' | 'message' | 'order'
          target_uuid: string
          report_reason: string
          report_details?: string | null
        }
        Returns: string
      }
      admin_moderate_user: {
        Args: { target_user_id: string; next_status: string; reason?: string | null; next_risk_score?: number | null }
        Returns: void
      }
      admin_moderate_service: {
        Args: { target_service_id: string; next_status: string; reason?: string | null }
        Returns: void
      }
      admin_moderate_review: {
        Args: { target_review_id: string; next_status: string; note?: string | null }
        Returns: void
      }
      admin_set_seller_verification: {
        Args: { target_user_id: string; next_status: string; note?: string | null }
        Returns: void
      }
      admin_resolve_report: {
        Args: { target_report_id: string; next_status: string; resolution_note?: string | null }
        Returns: void
      }
      admin_record_manual_adjustment: {
        Args: {
          target_user_id: string
          target_order_id?: string | null
          adjustment_kind: string
          adjustment_amount: number
          adjustment_reason: string
        }
        Returns: string
      }
      admin_upsert_category: {
        Args: {
          target_slug: string
          target_name: string
          target_description?: string | null
          target_icon?: string | null
          target_is_active?: boolean
        }
        Returns: string
      }
      admin_confirm_order_payment: {
        Args: {
          target_order_id: string
          target_payment_method?: 'beta_card' | 'loveworld_espees'
          confirmation_note?: string | null
        }
        Returns: string
      }
      mark_notification_read: {
        Args: { target_notification_id?: string | null }
        Returns: number
      }
      submit_completed_order_review: {
        Args: {
          target_order_id: string
          target_rating: number
          target_comment?: string | null
        }
        Returns: string
      }
      create_marketplace_order: {
        Args: {
          target_service_id: string
          buyer_requirements?: string | null
          scope_confirmation?: string | null
          terms_accepted?: boolean
        }
        Returns: string
      }
      request_order_cancellation: {
        Args: { target_order_id: string; reason: string }
        Returns: string
      }
      open_order_dispute: {
        Args: { target_order_id: string; reason: string }
        Returns: string
      }
      confirm_beta_payment: {
        Args: {
          target_order_id: string
          target_payment_method?: 'beta_card' | 'loveworld_espees'
        }
        Returns: string
      }
      confirm_provider_payment: {
        Args: {
          target_order_id: string
          target_payment_method: string
          target_provider: string
          target_reference: string
          target_metadata?: Json | null
        }
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
      update_public_profile_identity: {
        Args: {
          requested_username: string
          requested_visibility?: 'private' | 'marketplace' | 'public' | null
        }
        Returns: string
      }
    }
    Enums: {
      user_role: 'buyer' | 'seller' | 'admin' | 'moderator'
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
      notification_type:
        | 'NEW_MESSAGE'
        | 'ORDER_DELIVERY'
        | 'REVISION_REQUEST'
        | 'PAYMENT_CONFIRMATION'
        | 'SYSTEM_ALERT'
        | 'ABUSE_REPORT'
        | 'MODERATION_ACTION'
        | 'SELLER_VERIFICATION'
      service_status: 'draft' | 'pending_review' | 'active' | 'paused' | 'rejected' | 'archived'
      review_status: 'published' | 'hidden' | 'flagged'
    }
  }
}
