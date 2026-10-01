-- The original 0006 migration was recorded on some environments before their
-- imported homepage rows were converted.  This migration is intentionally
-- scoped to the homepage and remains a no-op once no legacy blocks exist.
--
-- It preserves a full pre-conversion snapshot in audit_logs, creates a
-- restore-compatible canonical revision, converts the seven 1:1 block types,
-- promotes partner_list to home_stats, and removes only rich_text (which has
-- no matching canonical homepage contract).
DO $$
DECLARE
  homepage record;
  legacy_snapshot jsonb;
  canonical_snapshot jsonb;
  default_appearance jsonb := '{"backgroundMediaId":null,"mobileBackgroundMediaId":null,"backgroundColor":null,"backgroundFit":"cover","focalPointX":50,"focalPointY":50,"overlay":"none"}'::jsonb;
BEGIN
  FOR homepage IN
    SELECT p.*
    FROM pages p
    WHERE p.slug = 'home'
      AND p.deleted_at IS NULL
      AND EXISTS (
        SELECT 1
        FROM page_blocks b
        WHERE b.page_id = p.id
          AND b.type IN ('hero', 'rich_text', 'partner_list', 'feature_grid', 'industry_grid', 'deployment', 'ecosystem', 'article_list', 'cta')
      )
  LOOP
    SELECT jsonb_build_object(
      'title', homepage.title,
      'seoTitle', homepage.seo_title,
      'seoDescription', homepage.seo_description,
      'canonicalUrl', homepage.canonical_url,
      'blocks', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'type', b.type,
            'isEnabled', b.is_enabled,
            'appearance', COALESCE(b.appearance, default_appearance),
            'data', b.data
          )
          ORDER BY b.sort_order
        ),
        '[]'::jsonb
      )
    )
    INTO legacy_snapshot
    FROM page_blocks b
    WHERE b.page_id = homepage.id;

    UPDATE page_blocks
    SET type = CASE type
      WHEN 'hero' THEN 'home_hero'::page_block_type
      WHEN 'feature_grid' THEN 'home_features'::page_block_type
      WHEN 'industry_grid' THEN 'home_industries'::page_block_type
      WHEN 'deployment' THEN 'home_process'::page_block_type
      WHEN 'ecosystem' THEN 'home_ecosystem_services'::page_block_type
      WHEN 'article_list' THEN 'home_featured_posts'::page_block_type
      WHEN 'cta' THEN 'home_cta'::page_block_type
      ELSE type
    END,
    updated_at = now()
    WHERE page_id = homepage.id;

    -- partner_list predates the dedicated home_stats schema.  Its logo items
    -- are retained; statistics start empty because the legacy shape had none.
    IF EXISTS (SELECT 1 FROM page_blocks WHERE page_id = homepage.id AND type = 'home_stats') THEN
      DELETE FROM page_blocks WHERE page_id = homepage.id AND type = 'partner_list';
    ELSE
      UPDATE page_blocks b
      SET type = 'home_stats'::page_block_type,
          data = jsonb_build_object(
            'stats', '[]'::jsonb,
            'partnersHeading', NULLIF(b.data->>'heading', ''),
            'partners', COALESCE(
              (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'name', item.value->>'name',
                    'mediaId', item.value->>'mediaId',
                    'websiteUrl', NULLIF(item.value->>'websiteUrl', '')
                  )
                )
                FROM jsonb_array_elements(COALESCE(b.data->'items', '[]'::jsonb)) AS item(value)
              ),
              '[]'::jsonb
            ),
            'partnersLimit', GREATEST(1, jsonb_array_length(COALESCE(b.data->'items', '[]'::jsonb)))
          ),
          updated_at = now()
      WHERE b.page_id = homepage.id AND b.type = 'partner_list';
    END IF;

    -- The legacy rich_text block is code-owned public content, not a canonical
    -- homepage CMS section.  Its original data remains in the audit snapshot
    -- and the pre-migration database backup.
    DELETE FROM page_blocks WHERE page_id = homepage.id AND type = 'rich_text';

    -- page_blocks has a unique (page_id, sort_order) constraint, so first move
    -- every row out of the normal range before assigning its compact position.
    UPDATE page_blocks
    SET sort_order = sort_order + 1000, updated_at = now()
    WHERE page_id = homepage.id;

    WITH ordered AS (
      SELECT id, row_number() OVER (ORDER BY sort_order) - 1 AS next_sort_order
      FROM page_blocks
      WHERE page_id = homepage.id
    )
    UPDATE page_blocks b
    SET sort_order = ordered.next_sort_order, updated_at = now()
    FROM ordered
    WHERE b.id = ordered.id;

    SELECT jsonb_build_object(
      'title', homepage.title,
      'seoTitle', homepage.seo_title,
      'seoDescription', homepage.seo_description,
      'canonicalUrl', homepage.canonical_url,
      'blocks', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'type', b.type,
            'isEnabled', b.is_enabled,
            'appearance', COALESCE(b.appearance, default_appearance),
            'data', b.data
          )
          ORDER BY b.sort_order
        ),
        '[]'::jsonb
      )
    )
    INTO canonical_snapshot
    FROM page_blocks b
    WHERE b.page_id = homepage.id;

    UPDATE pages
    SET draft_version = draft_version + 1, updated_at = now()
    WHERE id = homepage.id;

    INSERT INTO page_revisions (page_id, version_number, content_snapshot, change_note, is_published)
    SELECT homepage.id,
           COALESCE(MAX(version_number), 0) + 1,
           canonical_snapshot,
           'Hệ thống chuẩn hóa block trang chủ từ dữ liệu cũ',
           false
    FROM page_revisions
    WHERE page_id = homepage.id;

    INSERT INTO audit_logs (action, entity_type, entity_id, before_data, after_data)
    VALUES (
      'homepage.canonicalize_legacy_blocks',
      'page',
      homepage.id,
      legacy_snapshot,
      canonical_snapshot
    );
  END LOOP;
END $$;
