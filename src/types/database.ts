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
      conversations: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_group: boolean | null
          last_message_at: string | null
          last_message_text: string | null
          metadata: Json | null
          name: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          last_message_at?: string | null
          last_message_text?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          last_message_at?: string | null
          last_message_text?: string | null
          metadata?: Json | null
          name?: string | null
        }
      }
      message_receipts: {
        Row: {
          delivered_at: string | null
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          delivered_at?: string | null
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          delivered_at?: string | null
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
      }
      messages: {
        Row: {
          call_duration: number | null
          conversation_id: string | null
          created_at: string | null
          delivered_at: string | null
          file_url: string | null
          id: string
          is_read: boolean | null
          read_at: string | null
          sender_id: string | null
          text: string
          type: "text" | "image" | "video" | "file" | "call" | null
        }
        Insert: {
          call_duration?: number | null
          conversation_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          sender_id?: string | null
          text: string
          type?: "text" | "image" | "video" | "file" | "call" | null
        }
        Update: {
          call_duration?: number | null
          conversation_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          sender_id?: string | null
          text?: string
          type?: "text" | "image" | "video" | "file" | "call" | null
        }
      }
      participants: {
        Row: {
          conversation_id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string | null
          user_id?: string
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          full_name: string | null
          id: string
          is_online: boolean | null
          last_seen: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          full_name?: string | null
          id: string
          is_online?: boolean | null
          last_seen?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          full_name?: string | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}
