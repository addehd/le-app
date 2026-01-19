export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          created_at: string | null
          created_by: string | null
          framework: string
          html: string
          id: string
          is_active: boolean | null
          metadata: Json
          settings: Json
          source: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          framework?: string
          html: string
          id?: string
          is_active?: boolean | null
          metadata?: Json
          settings?: Json
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          framework?: string
          html?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json
          settings?: Json
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      brand: {
        Row: {
          colors: Json
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          logo_url: string | null
          name: string
          slogan: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          colors: Json
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          logo_url?: string | null
          name: string
          slogan?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          colors?: Json
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slogan?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      cards: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          id_name: string | null
          name: string | null
          projects_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          id_name?: string | null
          name?: string | null
          projects_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          id_name?: string | null
          name?: string | null
          projects_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_projects_id_fkey"
            columns: ["projects_id"]
            isOneToOne: false
            referencedRelation: "projects_invest"
            referencedColumns: ["id"]
          },
        ]
      }
      cart: {
        Row: {
          created_at: string | null
          id: string
          product_sku: string
          quantity: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_sku: string
          quantity: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_sku?: string
          quantity?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_product_sku_fkey"
            columns: ["product_sku"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["sku"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cert: {
        Row: {
          company: string | null
          created_at: string | null
          description: string | null
          id: number
          profile_id: string | null
          stocks: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          profile_id?: string | null
          stocks?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          profile_id?: string | null
          stocks?: string | null
        }
        Relationships: []
      }
      coach_bookings: {
        Row: {
          booking_date: string
          booking_time: string | null
          created_at: string | null
          currency: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          package_id: string
          package_title: string
          package_type: string
          session_count: number | null
          status: string | null
          total_price: number
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          booking_date: string
          booking_time?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          package_id: string
          package_title: string
          package_type: string
          session_count?: number | null
          status?: string | null
          total_price: number
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          booking_date?: string
          booking_time?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          package_id?: string
          package_title?: string
          package_type?: string
          session_count?: number | null
          status?: string | null
          total_price?: number
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coach_pages: {
        Row: {
          content: string
          created_at: string | null
          hero_image_url: string | null
          id: string
          images: Json | null
          is_active: boolean | null
          language: string | null
          meta_description: string | null
          slug: string
          sort_order: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          hero_image_url?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          language?: string | null
          meta_description?: string | null
          slug: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          hero_image_url?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          language?: string | null
          meta_description?: string | null
          slug?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coach_posts: {
        Row: {
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published_at: string | null
          slug: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coach_reviews: {
        Row: {
          client_name: string
          client_title: string | null
          created_at: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          quote: string
          rating: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_name: string
          client_title?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          quote: string
          rating?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_name?: string
          client_title?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          quote?: string
          rating?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      config: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      crawl_jobs: {
        Row: {
          completed_at: string | null
          config: Json
          created_at: string
          id: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          config?: Json
          created_at?: string
          id?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          config?: Json
          created_at?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      crawl_logs: {
        Row: {
          crawl_id: string
          created_at: string
          id: string
          level: string
          message: string
        }
        Insert: {
          crawl_id: string
          created_at?: string
          id?: string
          level?: string
          message: string
        }
        Update: {
          crawl_id?: string
          created_at?: string
          id?: string
          level?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_crawl_logs_crawl_id"
            columns: ["crawl_id"]
            isOneToOne: false
            referencedRelation: "crawl_job_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_crawl_logs_crawl_id"
            columns: ["crawl_id"]
            isOneToOne: false
            referencedRelation: "crawl_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      crawl_results: {
        Row: {
          cached_selectors: Json | null
          created_at: string | null
          domain: string
          error: string | null
          extracted_data: Json | null
          id: string
          keywords: string[]
          status: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          cached_selectors?: Json | null
          created_at?: string | null
          domain: string
          error?: string | null
          extracted_data?: Json | null
          id?: string
          keywords: string[]
          status?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          cached_selectors?: Json | null
          created_at?: string | null
          domain?: string
          error?: string | null
          extracted_data?: Json | null
          id?: string
          keywords?: string[]
          status?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      custom_design: {
        Row: {
          created_at: string
          id: string
          image_url: string
          metadata: Json | null
          prompt: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          metadata?: Json | null
          prompt: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          metadata?: Json | null
          prompt?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      estimate: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          estimated_hours: number
          hourly_rate: number
          id: string
          is_completed: boolean | null
          notes: string | null
          service_name: string
          status: string | null
          title: string
          total_cost: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          estimated_hours: number
          hourly_rate: number
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          service_name: string
          status?: string | null
          title: string
          total_cost?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          estimated_hours?: number
          hourly_rate?: number
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          service_name?: string
          status?: string | null
          title?: string
          total_cost?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flow_boards: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      flow_columns: {
        Row: {
          board_id: string | null
          color: string | null
          created_at: string | null
          id: string
          position: number
          title: string
          updated_at: string | null
        }
        Insert: {
          board_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          position: number
          title: string
          updated_at?: string | null
        }
        Update: {
          board_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          position?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flow_columns_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "flow_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_tasks: {
        Row: {
          board_id: string | null
          column_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          position: number
          priority: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          board_id?: string | null
          column_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          position: number
          priority?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          board_id?: string | null
          column_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flow_tasks_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "flow_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_tasks_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "flow_columns"
            referencedColumns: ["id"]
          },
        ]
      }
      hem: {
        Row: {
          created_at: string
          description: string | null
          id: string
          latitude: number
          longitude: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          latitude: number
          longitude: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number
          longitude?: number
          title?: string
        }
        Relationships: []
      }
      kanban: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      leads_invest: {
        Row: {
          created_at: string | null
          email: string
          id: number
          project_slug: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
          project_slug?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
          project_slug?: string | null
        }
        Relationships: []
      }
      legal_content: {
        Row: {
          content: Json
          content_type: string
          created_at: string | null
          id: number
          is_active: boolean | null
          last_updated: string | null
          title: string
        }
        Insert: {
          content: Json
          content_type: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_updated?: string | null
          title: string
        }
        Update: {
          content?: Json
          content_type?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_updated?: string | null
          title?: string
        }
        Relationships: []
      }
      map_config: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean
          map_start_latitude: number
          map_start_longitude: number
          map_zoom_level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          map_start_latitude: number
          map_start_longitude: number
          map_zoom_level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          map_start_latitude?: number
          map_start_longitude?: number
          map_zoom_level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price: number
          product_name: string
          product_sku: string
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          product_name: string
          product_sku: string
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          product_name?: string
          product_sku?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_city: string | null
          billing_country: string | null
          billing_email: string | null
          billing_name: string | null
          billing_postal_code: string | null
          billing_state: string | null
          created_at: string | null
          currency: string | null
          delivered_at: string | null
          id: string
          order_number: string
          payment_method: string | null
          payment_status: string | null
          shipped_at: string | null
          shipping_address: Json
          shipping_address_line1: string | null
          shipping_address_line2: string | null
          shipping_amount: number | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_email: string | null
          shipping_name: string | null
          shipping_phone: string | null
          shipping_postal_code: string | null
          shipping_state: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          subtotal_amount: number | null
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_name?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          created_at?: string | null
          currency?: string | null
          delivered_at?: string | null
          id?: string
          order_number: string
          payment_method?: string | null
          payment_status?: string | null
          shipped_at?: string | null
          shipping_address: Json
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_amount?: number | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_email?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_amount?: number | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_name?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          created_at?: string | null
          currency?: string | null
          delivered_at?: string | null
          id?: string
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          shipped_at?: string | null
          shipping_address?: Json
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_amount?: number | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_email?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_amount?: number | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      padron_ruc: {
        Row: {
          actividad_economica_r3_principal: string | null
          actividad_economica_r3_secundaria: string | null
          actividad_economica_r4_principal: string | null
          comercio_exterior: string | null
          condicion: string | null
          departamento: string | null
          distrito: string | null
          estado: string | null
          nro_trab: string | null
          periodo_publicacion: string | null
          provincia: string | null
          ruc: string | null
          tipo: string | null
          tipo_contabilidad: string | null
          tipo_facturacion: string | null
          ubigeo: string | null
        }
        Insert: {
          actividad_economica_r3_principal?: string | null
          actividad_economica_r3_secundaria?: string | null
          actividad_economica_r4_principal?: string | null
          comercio_exterior?: string | null
          condicion?: string | null
          departamento?: string | null
          distrito?: string | null
          estado?: string | null
          nro_trab?: string | null
          periodo_publicacion?: string | null
          provincia?: string | null
          ruc?: string | null
          tipo?: string | null
          tipo_contabilidad?: string | null
          tipo_facturacion?: string | null
          ubigeo?: string | null
        }
        Update: {
          actividad_economica_r3_principal?: string | null
          actividad_economica_r3_secundaria?: string | null
          actividad_economica_r4_principal?: string | null
          comercio_exterior?: string | null
          condicion?: string | null
          departamento?: string | null
          distrito?: string | null
          estado?: string | null
          nro_trab?: string | null
          periodo_publicacion?: string | null
          provincia?: string | null
          ruc?: string | null
          tipo?: string | null
          tipo_contabilidad?: string | null
          tipo_facturacion?: string | null
          ubigeo?: string | null
        }
        Relationships: []
      }
      print: {
        Row: {
          additional_notes: string | null
          company: string | null
          created_at: string | null
          currency: string | null
          customer_name: string
          email: string
          id: string
          language: string | null
          logo_filename: string | null
          logo_position: string | null
          logo_url: string | null
          phone: string | null
          quantity: number
          quote_amount: number | null
          selected_services: Json
          status: string | null
          updated_at: string | null
        }
        Insert: {
          additional_notes?: string | null
          company?: string | null
          created_at?: string | null
          currency?: string | null
          customer_name: string
          email: string
          id?: string
          language?: string | null
          logo_filename?: string | null
          logo_position?: string | null
          logo_url?: string | null
          phone?: string | null
          quantity: number
          quote_amount?: number | null
          selected_services?: Json
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_notes?: string | null
          company?: string | null
          created_at?: string | null
          currency?: string | null
          customer_name?: string
          email?: string
          id?: string
          language?: string | null
          logo_filename?: string | null
          logo_position?: string | null
          logo_url?: string | null
          phone?: string | null
          quantity?: number
          quote_amount?: number | null
          selected_services?: Json
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_results: {
        Row: {
          confidence_score: number
          crawl_id: string
          extracted_at: string
          id: string
          product_data: Json
          url: string
        }
        Insert: {
          confidence_score?: number
          crawl_id: string
          extracted_at?: string
          id?: string
          product_data?: Json
          url: string
        }
        Update: {
          confidence_score?: number
          crawl_id?: string
          extracted_at?: string
          id?: string
          product_data?: Json
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_results_crawl_id"
            columns: ["crawl_id"]
            isOneToOne: false
            referencedRelation: "crawl_job_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_results_crawl_id"
            columns: ["crawl_id"]
            isOneToOne: false
            referencedRelation: "crawl_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          attributes: Json
          brand: string | null
          categories: Json
          created_at: string
          created_by: string | null
          currency: string
          description: string
          dimensions_cm: Json | null
          id: string
          images: Json
          name: string
          price: number
          product_type: string | null
          project_id: number | null
          sale_end: string | null
          sale_price: number | null
          sale_start: string | null
          service_attributes: Json | null
          sku: string
          slug: string
          status: string
          stock: number
          updated_at: string
          weight_grams: number | null
        }
        Insert: {
          attributes?: Json
          brand?: string | null
          categories?: Json
          created_at?: string
          created_by?: string | null
          currency?: string
          description: string
          dimensions_cm?: Json | null
          id?: string
          images: Json
          name: string
          price: number
          product_type?: string | null
          project_id?: number | null
          sale_end?: string | null
          sale_price?: number | null
          sale_start?: string | null
          service_attributes?: Json | null
          sku: string
          slug: string
          status?: string
          stock?: number
          updated_at?: string
          weight_grams?: number | null
        }
        Update: {
          attributes?: Json
          brand?: string | null
          categories?: Json
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          dimensions_cm?: Json | null
          id?: string
          images?: Json
          name?: string
          price?: number
          product_type?: string | null
          project_id?: number | null
          sale_end?: string | null
          sale_price?: number | null
          sale_start?: string | null
          service_attributes?: Json | null
          sku?: string
          slug?: string
          status?: string
          stock?: number
          updated_at?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_info"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      project_admins: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          project_id: number
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id: number
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id?: number
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_admins_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_info"
            referencedColumns: ["id"]
          },
        ]
      }
      projects_info: {
        Row: {
          categories: string[] | null
          category: string | null
          country_flag: string | null
          fav: string | null
          gallery_image_urls: string[] | null
          hero_img: string | null
          id: number
          location: string | null
          name: string
          profile_image_url: string | null
          project_info: string | null
          tags: string[] | null
          url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          categories?: string[] | null
          category?: string | null
          country_flag?: string | null
          fav?: string | null
          gallery_image_urls?: string[] | null
          hero_img?: string | null
          id?: number
          location?: string | null
          name: string
          profile_image_url?: string | null
          project_info?: string | null
          tags?: string[] | null
          url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          categories?: string[] | null
          category?: string | null
          country_flag?: string | null
          fav?: string | null
          gallery_image_urls?: string[] | null
          hero_img?: string | null
          id?: number
          location?: string | null
          name?: string
          profile_image_url?: string | null
          project_info?: string | null
          tags?: string[] | null
          url?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      projects_invest: {
        Row: {
          created_at: string | null
          description: string | null
          hero_img: string | null
          id: string
          industry: string | null
          name: string | null
          prospect: Json | null
          prospect_markdown: string | null
          state: string | null
          updated_at: string | null
          url_slug: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          hero_img?: string | null
          id?: string
          industry?: string | null
          name?: string | null
          prospect?: Json | null
          prospect_markdown?: string | null
          state?: string | null
          updated_at?: string | null
          url_slug?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          hero_img?: string | null
          id?: string
          industry?: string | null
          name?: string | null
          prospect?: Json | null
          prospect_markdown?: string | null
          state?: string | null
          updated_at?: string | null
          url_slug?: string | null
        }
        Relationships: []
      }
      property_links: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image: string | null
          latitude: number | null
          longitude: number | null
          property_data: Json | null
          shared_at: string
          shared_by: string
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          image?: string | null
          latitude?: number | null
          longitude?: number | null
          property_data?: Json | null
          shared_at?: string
          shared_by?: string
          title?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          latitude?: number | null
          longitude?: number | null
          property_data?: Json | null
          shared_at?: string
          shared_by?: string
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          created_at: string | null
          currency: string | null
          date: string | null
          error_message: string | null
          file_name: string
          file_type: string
          id: string
          merchant: string | null
          processed_data: Json | null
          processing_status: string | null
          raw_text: string | null
          total: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          date?: string | null
          error_message?: string | null
          file_name: string
          file_type: string
          id?: string
          merchant?: string | null
          processed_data?: Json | null
          processing_status?: string | null
          raw_text?: string | null
          total?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          date?: string | null
          error_message?: string | null
          file_name?: string
          file_type?: string
          id?: string
          merchant?: string | null
          processed_data?: Json | null
          processing_status?: string | null
          raw_text?: string | null
          total?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      service_bookings: {
        Row: {
          booking_date: string
          booking_time: string
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          duration_minutes: number
          id: string
          location_address: string | null
          location_notes: string | null
          location_type: string
          order_item_id: string | null
          participants: number | null
          product_sku: string
          provider_id: string | null
          provider_name: string | null
          special_notes: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          duration_minutes?: number
          id?: string
          location_address?: string | null
          location_notes?: string | null
          location_type?: string
          order_item_id?: string | null
          participants?: number | null
          product_sku: string
          provider_id?: string | null
          provider_name?: string | null
          special_notes?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          duration_minutes?: number
          id?: string
          location_address?: string | null
          location_notes?: string | null
          location_type?: string
          order_item_id?: string | null
          participants?: number | null
          product_sku?: string
          provider_id?: string | null
          provider_name?: string | null
          special_notes?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          email: string | null
          id: number
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: number
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: number
        }
        Relationships: []
      }
      teacher_ratings: {
        Row: {
          created_at: string | null
          id: number
          reviewer_avatar: string | null
          reviewer_name: string | null
          stars: number
          teacher_id: number | null
          text: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          reviewer_avatar?: string | null
          reviewer_name?: string | null
          stars: number
          teacher_id?: number | null
          text?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          reviewer_avatar?: string | null
          reviewer_name?: string | null
          stars?: number
          teacher_id?: number | null
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_ratings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          category: string | null
          country_flag: string | null
          gallery_image_urls: string[] | null
          hero_img: string | null
          id: number
          location: string | null
          name: string
          profile_image_url: string | null
          tags: string[] | null
          teacher_info: string | null
          teaches_in: string | null
        }
        Insert: {
          category?: string | null
          country_flag?: string | null
          gallery_image_urls?: string[] | null
          hero_img?: string | null
          id?: number
          location?: string | null
          name: string
          profile_image_url?: string | null
          tags?: string[] | null
          teacher_info?: string | null
          teaches_in?: string | null
        }
        Update: {
          category?: string | null
          country_flag?: string | null
          gallery_image_urls?: string[] | null
          hero_img?: string | null
          id?: number
          location?: string | null
          name?: string
          profile_image_url?: string | null
          tags?: string[] | null
          teacher_info?: string | null
          teaches_in?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      crawl_job_stats: {
        Row: {
          avg_confidence: number | null
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          error_count: number | null
          id: string | null
          products_found: number | null
          status: string | null
          warning_count: number | null
        }
        Relationships: []
      }
      recent_crawl_activity: {
        Row: {
          activity_type: string | null
          crawl_id: string | null
          details: Json | null
          timestamp: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_crawl_jobs: { Args: { days_old?: number }; Returns: number }
      generate_order_number: { Args: never; Returns: string }
      get_crawl_summary: {
        Args: { job_id: string }
        Returns: {
          avg_confidence: number
          completed_at: string
          config: Json
          created_at: string
          duration_seconds: number
          error_logs: number
          id: string
          products_found: number
          status: string
          total_logs: number
          warning_logs: number
        }[]
      }
      get_order_stats: { Args: never; Returns: Json }
      get_product_stats: { Args: never; Returns: Json }
      get_product_stats_by_domain: {
        Args: never
        Returns: {
          avg_confidence: number
          domain: string
          last_crawl: string
          total_products: number
        }[]
      }
      get_project_by_slug: { Args: { project_slug: string }; Returns: number }
      get_user_projects: {
        Args: { user_id_param: string }
        Returns: {
          id: number
          name: string
          project_id: number
          role: string
          url: string
        }[]
      }
      is_project_admin: {
        Args: { project_id: number; user_id: string }
        Returns: boolean
      }
      jsonb_section_to_markdown: {
        Args: { section_data: Json; section_key: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
