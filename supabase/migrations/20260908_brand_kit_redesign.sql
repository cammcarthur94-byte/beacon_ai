-- Migration: 20260908_brand_kit_redesign.sql
-- Description: Redesign and enrich projects.brand_kit JSONB schema to support
--              geographic target markets, negative keyword exclusions,
--              structured messaging pillars, weighted tone dimensions, and hierarchical taxonomy.

-- 1. Add schema documentation comment on the brand_kit column
COMMENT ON COLUMN public.projects.brand_kit IS 'Extended Brand Kit context calibration JSONB. Schema:
{
  "industry": text,
  "industry_taxonomy": {
    "sector": text,
    "category": text,
    "subCategory": text
  },
  "target_audience": text,
  "core_offerings": text (High-level category pillars & product lines, no SKU-level bloat),
  "competitors": [{"name": text, "domain": text}],
  "target_regions": text[] (e.g. ["North America", "Global", "APAC"]),
  "negative_keywords": text[] (terms to strictly avoid associating with the brand),
  "messaging_pillars": text[] (3-4 core value propositions and strategic narratives),
  "tone_of_voice": text (compiled executive tone summary),
  "tone_dimensions": {
    "formal_casual": integer (0-100),
    "technical_accessible": integer (0-100),
    "bold_understated": integer (0-100),
    "analytical_inspiring": integer (0-100)
  },
  "tone_tags": text[]
}';

-- 2. Safely initialize new JSONB keys on existing projects rows without overwriting existing data
UPDATE public.projects
SET brand_kit = jsonb_strip_nulls(
  jsonb_build_object(
    'industry', COALESCE(brand_kit->>'industry', 'Premium Athleisure & Athletic Apparel'),
    'industry_taxonomy', COALESCE(brand_kit->'industry_taxonomy', jsonb_build_object(
      'sector', 'Retail, Apparel & Consumer Goods',
      'category', 'Activewear & Athleisure'
    )),
    'target_audience', COALESCE(brand_kit->>'target_audience', 'Mindful movement practitioners, yoga & fitness lifestyle consumers'),
    'core_offerings', COALESCE(brand_kit->>'core_offerings', 'Performance Activewear, Technical Outerwear, Everyday Movement Apparel'),
    'competitors', COALESCE(brand_kit->'competitors', '[
      {"name": "Alo Yoga", "domain": "aloyoga.com"},
      {"name": "Vuori", "domain": "vuoriclothing.com"},
      {"name": "Athleta", "domain": "athleta.gap.com"}
    ]'::jsonb),
    'target_regions', COALESCE(brand_kit->'target_regions', '["North America", "Global"]'::jsonb),
    'negative_keywords', COALESCE(brand_kit->'negative_keywords', '["fast fashion", "cheap dupes", "discount outlet", "drop-shipping"]'::jsonb),
    'messaging_pillars', COALESCE(brand_kit->'messaging_pillars', '[
      "Proprietary Technical Fabric Innovation",
      "Mindful Movement & Wellness Community",
      "Elevated Performance Luxury",
      "Sustainable Longevity & Durability"
    ]'::jsonb),
    'tone_of_voice', COALESCE(brand_kit->>'tone_of_voice', 'Inspiring, elevated, technical, and mindful'),
    'tone_dimensions', COALESCE(brand_kit->'tone_dimensions', jsonb_build_object(
      'formal_casual', 45,
      'technical_accessible', 70,
      'bold_understated', 40,
      'analytical_inspiring', 80
    )),
    'tone_tags', COALESCE(brand_kit->'tone_tags', '["Empowering", "Mindful", "Technical", "Elevated"]'::jsonb)
  )
)
WHERE brand_kit IS NOT NULL;
