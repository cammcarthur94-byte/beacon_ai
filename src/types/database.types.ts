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
export type CitationSourceType = 'news' | 'forum' | 'blog' | 'documentation' | 'social' | 'other';
export type SearchIntent = 'informational' | 'navigational' | 'commercial' | 'transactional';
export type BrandAssociation = 'branded' | 'unbranded';
export type OutreachStage = 'generated' | 'pitch_sent' | 'review_scheduled' | 'published_won';
export type OutreachPriority = 'low' | 'medium' | 'high' | 'critical';
export type TruthCategory = 'pricing' | 'features' | 'integrations' | 'compliance' | 'specifications' | 'general';
export type HallucinationSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'unreviewed' | 'acknowledged' | 'resolved' | 'false_positive';

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

export type ContentStudioFormat =
  | 'Social Media Post'
  | 'Reddit Post'
  | 'Newsletter'
  | 'LinkedIn Post'
  | 'Blog Post'
  | 'Outreach Email'
  | 'FAQ';

export interface ContentDraft {
  id: string;
  project_id: string;
  gap_id?: string | null;
  target_domain: string;
  target_topic: string;
  competitors: string[] | { name: string; domain?: string }[];
  content_type: ContentStudioFormat;
  angle_title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface BrandTruth {
  id: string;
  project_id: string;
  category: TruthCategory;
  claim_topic: string;
  ground_truth_statement: string;
  acceptable_variations: string[];
  contradiction_triggers: string[];
  verified_source_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HallucinationAlert {
  id: string;
  project_id: string;
  truth_id?: string | null;
  result_id: string;
  engine: string;
  discrepancy_summary: string;
  hallucinated_statement: string;
  ground_truth_context: string;
  severity: HallucinationSeverity;
  status: AlertStatus;
  created_at: string;
  updated_at: string;
}

export interface EntityMention {
  id: string;
  project_id: string;
  prompt_id?: string | null;
  result_id?: string | null;
  engine: string;
  entity_name: string;
  entity_type: string;
  sentiment: SentimentType;
  associated_target: string;
  is_brand: boolean;
  frequency: number;
  context_snippet?: string | null;
  created_at: string;
}

export interface LlmsTxtCuratedLink {
  title: string;
  url: string;
  description?: string;
}

export interface LlmsTxtSection {
  title: string;
  content: string;
}

export interface LlmsTxtConfig {
  id: string;
  project_id: string;
  title: string;
  summary: string;
  curated_links: LlmsTxtCuratedLink[];
  custom_sections: LlmsTxtSection[];
  raw_llms_txt: string;
  raw_llms_full_txt: string;
  is_published: boolean;
  published_at?: string | null;
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

export type PermissionAction =
  | 'manage_billing'
  | 'manage_team'
  | 'edit_brand_kit'
  | 'manage_prompts'
  | 'trigger_audits'
  | 'export_reports'
  | 'view_telemetry';

export type RolePermissionsConfig = Record<TeamMemberRole, PermissionAction[]>;

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionsConfig = {
  owner: [
    'manage_billing',
    'manage_team',
    'edit_brand_kit',
    'manage_prompts',
    'trigger_audits',
    'export_reports',
    'view_telemetry',
  ],
  admin: [
    'manage_team',
    'edit_brand_kit',
    'manage_prompts',
    'trigger_audits',
    'export_reports',
    'view_telemetry',
  ],
  editor: [
    'manage_prompts',
    'trigger_audits',
    'export_reports',
    'view_telemetry',
  ],
  viewer: [
    'export_reports',
    'view_telemetry',
  ],
};

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: TeamMemberRole;
  avatarUrl?: string;
  lastActive: string;
  userId?: string;
  projectId?: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: TeamMemberRole;
  status: 'pending' | 'accepted' | 'revoked';
  sentAt: string;
  token?: string;
  projectId?: string;
  invitedBy?: string;
  expiresAt?: string;
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
          role_permissions?: RolePermissionsConfig | null;
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
          role_permissions?: RolePermissionsConfig | Json | null;
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
          role_permissions?: RolePermissionsConfig | Json | null;
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
          parent_id: string | null;
          turn_index: number;
          persona_id: string | null;
          thread_id: string | null;
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
          parent_id?: string | null;
          turn_index?: number;
          persona_id?: string | null;
          thread_id?: string | null;
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
          parent_id?: string | null;
          turn_index?: number;
          persona_id?: string | null;
          thread_id?: string | null;
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
      team_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string | null;
          email: string;
          name: string;
          role: TeamMemberRole;
          avatar_url: string | null;
          last_active: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id?: string | null;
          email: string;
          name: string;
          role: TeamMemberRole;
          avatar_url?: string | null;
          last_active?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string | null;
          email?: string;
          name?: string;
          role?: TeamMemberRole;
          avatar_url?: string | null;
          last_active?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      team_invitations: {
        Row: {
          id: string;
          project_id: string;
          email: string;
          role: TeamMemberRole;
          status: 'pending' | 'accepted' | 'revoked';
          token: string;
          invited_by: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          email: string;
          role: TeamMemberRole;
          status?: 'pending' | 'accepted' | 'revoked';
          token?: string;
          invited_by?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          email?: string;
          role?: TeamMemberRole;
          status?: 'pending' | 'accepted' | 'revoked';
          token?: string;
          invited_by?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      content_drafts: {
        Row: {
          id: string;
          project_id: string;
          gap_id: string | null;
          target_domain: string;
          target_topic: string;
          competitors: Json;
          content_type: string;
          angle_title: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          gap_id?: string | null;
          target_domain: string;
          target_topic: string;
          competitors?: Json;
          content_type: string;
          angle_title: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          gap_id?: string | null;
          target_domain?: string;
          target_topic?: string;
          competitors?: Json;
          content_type?: string;
          angle_title?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      personas: {
        Row: {
          id: string;
          project_id: string | null;
          name: string;
          role_title: string;
          name_title: string | null;
          age_demographics: string | null;
          background: string | null;
          goals: string | null;
          pain_points: string | null;
          information_sources: string | null;
          buying_objections: string | null;
          system_prompt: string;
          tone_traits: string[];
          is_system: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          name: string;
          role_title?: string;
          name_title?: string | null;
          age_demographics?: string | null;
          background?: string | null;
          goals?: string | null;
          pain_points?: string | null;
          information_sources?: string | null;
          buying_objections?: string | null;
          system_prompt: string;
          tone_traits?: string[];
          is_system?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          name?: string;
          role_title?: string;
          name_title?: string | null;
          age_demographics?: string | null;
          background?: string | null;
          goals?: string | null;
          pain_points?: string | null;
          information_sources?: string | null;
          buying_objections?: string | null;
          system_prompt?: string;
          tone_traits?: string[];
          is_system?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      brand_truths: {
        Row: {
          id: string;
          project_id: string;
          category: TruthCategory;
          claim_topic: string;
          ground_truth_statement: string;
          acceptable_variations: string[];
          contradiction_triggers: string[];
          verified_source_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          category?: TruthCategory;
          claim_topic: string;
          ground_truth_statement: string;
          acceptable_variations?: string[];
          contradiction_triggers?: string[];
          verified_source_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          category?: TruthCategory;
          claim_topic?: string;
          ground_truth_statement?: string;
          acceptable_variations?: string[];
          contradiction_triggers?: string[];
          verified_source_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      hallucination_alerts: {
        Row: {
          id: string;
          project_id: string;
          truth_id: string | null;
          result_id: string;
          engine: string;
          discrepancy_summary: string;
          hallucinated_statement: string;
          ground_truth_context: string;
          severity: HallucinationSeverity;
          status: AlertStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          truth_id?: string | null;
          result_id: string;
          engine: string;
          discrepancy_summary: string;
          hallucinated_statement: string;
          ground_truth_context: string;
          severity?: HallucinationSeverity;
          status?: AlertStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          truth_id?: string | null;
          result_id?: string;
          engine?: string;
          discrepancy_summary?: string;
          hallucinated_statement?: string;
          ground_truth_context?: string;
          severity?: HallucinationSeverity;
          status?: AlertStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      entity_mentions: {
        Row: {
          id: string;
          project_id: string;
          prompt_id: string | null;
          result_id: string | null;
          engine: string;
          entity_name: string;
          entity_type: string;
          sentiment: SentimentType;
          associated_target: string;
          is_brand: boolean;
          frequency: number;
          context_snippet: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          prompt_id?: string | null;
          result_id?: string | null;
          engine: string;
          entity_name: string;
          entity_type?: string;
          sentiment?: SentimentType;
          associated_target: string;
          is_brand?: boolean;
          frequency?: number;
          context_snippet?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          prompt_id?: string | null;
          result_id?: string | null;
          engine?: string;
          entity_name?: string;
          entity_type?: string;
          sentiment?: SentimentType;
          associated_target?: string;
          is_brand?: boolean;
          frequency?: number;
          context_snippet?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      llms_txt_configs: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          summary: string;
          curated_links: Json;
          custom_sections: Json;
          raw_llms_txt: string;
          raw_llms_full_txt: string;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          summary: string;
          curated_links?: Json;
          custom_sections?: Json;
          raw_llms_txt?: string;
          raw_llms_full_txt?: string;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          summary?: string;
          curated_links?: Json;
          custom_sections?: Json;
          raw_llms_txt?: string;
          raw_llms_full_txt?: string;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
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
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
