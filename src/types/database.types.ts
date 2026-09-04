export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BillingTier = 'starter' | 'pro' | 'growth' | 'enterprise';
export type AuditFrequency = 'daily' | 'weekly' | 'biweekly';
export type SentimentType = 'positive' | 'neutral' | 'negative';
export type ChatSender = 'user' | 'agent';
export type CitationSourceType = 'news' | 'forum' | 'blog' | 'documentation' | 'social' | 'other';
export type SearchIntent = 'informational' | 'navigational' | 'commercial' | 'transactional';
export type BrandAssociation = 'branded' | 'unbranded';
export type OutreachStage = 'generated' | 'pitch_sent' | 'review_scheduled' | 'published_won';
export type OutreachPriority = 'low' | 'medium' | 'high' | 'critical';

export interface OutreachPitch {
  id: string;
  project_id: string;
  publication_name: string;
  publication_domain: string;
  article_url?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_role?: string | null;
  stage: OutreachStage;
  priority: OutreachPriority;
  pitch_subject: string;
  pitch_body: string;
  editor_angle?: string | null;
  suggested_hook?: string | null;
  competitor_displaced?: string | null;
  target_engine?: string | null;
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompetitorInfo {
  name: string;
  domain: string;
}

export interface ToneDimensions {
  formal_casual: number; // 0 (Formal) to 100 (Casual)
  technical_accessible: number; // 0 (Technical) to 100 (Accessible)
  bold_understated?: number; // 0 (Bold) to 100 (Understated)
  analytical_inspiring?: number; // 0 (Analytical) to 100 (Inspiring)
}

export interface IndustryTaxonomy {
  sector: string;
  category: string;
  subCategory?: string;
}

export type NegativeExclusionSeverity = 'mild' | 'strict';

export interface NegativeExclusionItem {
  term: string;
  severity: NegativeExclusionSeverity;
}

export interface BrandKit {
  [key: string]: any;
  industry: string;
  industry_taxonomy?: IndustryTaxonomy;
  target_audience: string;
  core_offerings: string;
  competitors: CompetitorInfo[];
  target_regions?: string[];
  negative_keywords?: (string | NegativeExclusionItem)[];
  messaging_pillars?: string[];
  tone_of_voice: string;
  tone_dimensions?: ToneDimensions;
  tone_tags?: string[];
}

// Enterprise Settings Suite Types
export type TeamMemberRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: TeamMemberRole;
  avatarUrl?: string;
  lastActive: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: TeamMemberRole;
  status: 'pending' | 'accepted' | 'revoked';
  sentAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string | null;
  scopes: string[];
}

export interface WebhookConfig {
  id: string;
  url: string;
  eventTypes: string[];
  isActive: boolean;
  secret: string;
  lastTriggered?: string | null;
}

export interface ConnectedIntegration {
  id: string;
  name: string;
  type: string;
  description: string;
  connected: boolean;
  accountId?: string;
  lastSynced?: string | null;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: string;
  currency: string;
  status: 'paid' | 'open' | 'void';
}

export interface WorkspaceLocalization {
  timezone: string;
  language: string;
  dateFormat: string;
  logoUrl?: string;
  faviconUrl?: string;
  ssoEnabled?: boolean;
}

import type { ExecutiveReportData } from '@/lib/schemas/executive-report';
export type { ExecutiveReportData };

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          domain: string;
          tier: BillingTier;
          audit_limit: number;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          brand_kit: BrandKit;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          domain: string;
          tier?: BillingTier;
          audit_limit?: number;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          brand_kit?: BrandKit | Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          domain?: string;
          tier?: BillingTier;
          audit_limit?: number;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          brand_kit?: BrandKit | Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      prompts: {
        Row: {
          id: string;
          project_id: string;
          query_text: string;
          frequency: AuditFrequency;
          target_engines: string[];
          search_intent: SearchIntent;
          brand_association: BrandAssociation;
          is_active: boolean;
          last_run_at: string | null;
          next_run_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          query_text: string;
          frequency?: AuditFrequency;
          target_engines?: string[];
          search_intent?: SearchIntent;
          brand_association?: BrandAssociation;
          is_active?: boolean;
          last_run_at?: string | null;
          next_run_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          query_text?: string;
          frequency?: AuditFrequency;
          target_engines?: string[];
          search_intent?: SearchIntent;
          brand_association?: BrandAssociation;
          is_active?: boolean;
          last_run_at?: string | null;
          next_run_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      results: {
        Row: {
          id: string;
          prompt_id: string;
          engine: string;
          visibility_score: number;
          brand_mentioned: boolean;
          sentiment: SentimentType;
          sentiment_score: number;
          raw_text: string;
          cited_urls: string[];
          ranking_position: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          prompt_id: string;
          engine: string;
          visibility_score?: number;
          brand_mentioned?: boolean;
          sentiment?: SentimentType;
          sentiment_score?: number;
          raw_text: string;
          cited_urls?: string[];
          ranking_position?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          prompt_id?: string;
          engine?: string;
          visibility_score?: number;
          brand_mentioned?: boolean;
          sentiment?: SentimentType;
          sentiment_score?: number;
          raw_text?: string;
          cited_urls?: string[];
          ranking_position?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          project_id: string;
          sender: ChatSender;
          content: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          sender: ChatSender;
          content: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          sender?: ChatSender;
          content?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      citations: {
        Row: {
          id: string;
          project_id: string;
          run_id: string | null;
          engine: string | null;
          url: string;
          domain: string;
          source_type: CitationSourceType;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          run_id?: string | null;
          engine?: string | null;
          url: string;
          domain: string;
          source_type: CitationSourceType;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          run_id?: string | null;
          engine?: string | null;
          url?: string;
          domain?: string;
          source_type?: CitationSourceType;
          created_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          project_id: string;
          date_range: '7d' | '30d' | 'all';
          report_data: ExecutiveReportData;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          date_range: '7d' | '30d' | 'all';
          report_data: ExecutiveReportData | Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          date_range?: '7d' | '30d' | 'all';
          report_data?: ExecutiveReportData | Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      billing_tier_enum: BillingTier;
      audit_frequency_enum: AuditFrequency;
      sentiment_enum: SentimentType;
      chat_sender_enum: ChatSender;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
