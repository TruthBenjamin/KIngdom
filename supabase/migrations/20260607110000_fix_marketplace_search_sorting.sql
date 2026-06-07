-- =====================================================================
-- KINGDOM MARKETPLACE: SEARCH SORT REPAIR
-- Purpose: Makes top_rated sort by seller rating/review count on existing DBs.
-- =====================================================================

CREATE OR REPLACE FUNCTION marketplace_search_services(
  search_query TEXT DEFAULT NULL,
  target_category_slug TEXT DEFAULT NULL,
  min_price INTEGER DEFAULT NULL,
  max_price INTEGER DEFAULT NULL,
  result_sort TEXT DEFAULT 'popular',
  result_limit INTEGER DEFAULT 24,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  service_id UUID,
  ranking_score NUMERIC,
  total_count BIGINT
) AS $$
WITH normalized AS (
  SELECT
    NULLIF(TRIM(search_query), '') AS q,
    NULLIF(TRIM(target_category_slug), '') AS category_slug,
    LEAST(GREATEST(COALESCE(result_limit, 24), 1), 60) AS safe_limit,
    GREATEST(COALESCE(result_offset, 0), 0) AS safe_offset,
    COALESCE(NULLIF(result_sort, ''), 'popular') AS safe_sort
),
query_terms AS (
  SELECT
    normalized.*,
    CASE WHEN normalized.q IS NULL THEN NULL ELSE websearch_to_tsquery('english', normalized.q) END AS tsq
  FROM normalized
),
ranked AS (
  SELECT
    services.id,
    services.price,
    services.created_at,
    services.is_featured,
    COALESCE(services.quality_score, 0) AS quality_score,
    COALESCE(profiles.rating, 0) AS seller_rating,
    COALESCE(profiles.reviews_count, 0) AS seller_reviews,
    COALESCE(seller_profiles.profile_completion_score, 0) AS profile_completion_score,
    COALESCE(seller_profiles.response_time_minutes, 1440) AS response_time_minutes,
    seller_profiles.verification_status,
    CASE
      WHEN query_terms.tsq IS NULL THEN 0
      ELSE ts_rank_cd(services.search_vector, query_terms.tsq)
    END AS text_rank,
    CASE
      WHEN query_terms.q IS NOT NULL AND services.category_slug = query_terms.category_slug THEN 0.18
      WHEN query_terms.q IS NOT NULL AND services.category ILIKE '%' || query_terms.q || '%' THEN 0.12
      WHEN query_terms.q IS NOT NULL AND services.tags::TEXT ILIKE '%' || query_terms.q || '%' THEN 0.08
      ELSE 0
    END AS category_rank,
    (1 / (1 + (EXTRACT(EPOCH FROM (NOW() - services.created_at)) / 86400 / 30)))::NUMERIC AS recent_rank
  FROM services
  CROSS JOIN query_terms
  LEFT JOIN profiles ON profiles.user_id = services.seller_id
  LEFT JOIN seller_profiles ON seller_profiles.user_id = services.seller_id
  WHERE services.is_active = TRUE
    AND COALESCE(services.moderation_status::TEXT, services.status::TEXT, 'active') = 'active'
    AND (query_terms.category_slug IS NULL OR query_terms.category_slug = 'all' OR services.category_slug = query_terms.category_slug)
    AND (min_price IS NULL OR services.price >= min_price)
    AND (max_price IS NULL OR services.price <= max_price)
    AND (
      query_terms.q IS NULL
      OR services.search_vector @@ query_terms.tsq
      OR services.title ILIKE '%' || query_terms.q || '%'
      OR services.description ILIKE '%' || query_terms.q || '%'
      OR services.category ILIKE '%' || query_terms.q || '%'
      OR services.tags::TEXT ILIKE '%' || query_terms.q || '%'
    )
),
scored AS (
  SELECT
    ranked.id,
    ranked.price,
    ranked.created_at,
    ranked.is_featured,
    ranked.seller_rating,
    ranked.seller_reviews,
    (
      ranked.text_rank * 1.7
      + ranked.category_rank
      + LEAST(ranked.seller_rating / 5, 1) * 0.22
      + LEAST(ranked.seller_reviews / 50.0, 1) * 0.12
      + LEAST(ranked.quality_score / 100.0, 1) * 0.16
      + LEAST(ranked.profile_completion_score / 100.0, 1) * 0.08
      + CASE WHEN ranked.verification_status = 'verified' THEN 0.1 ELSE 0 END
      + CASE WHEN ranked.response_time_minutes <= 120 THEN 0.05 ELSE 0 END
      + ranked.recent_rank * 0.15
      + CASE WHEN ranked.is_featured THEN 0.06 ELSE 0 END
    )::NUMERIC AS score
  FROM ranked
),
counted AS (
  SELECT
    scored.*,
    COUNT(*) OVER() AS total_rows
  FROM scored
)
SELECT
  counted.id AS service_id,
  ROUND(counted.score, 6) AS ranking_score,
  counted.total_rows AS total_count
FROM counted
CROSS JOIN normalized
ORDER BY
  CASE WHEN normalized.safe_sort IN ('popular', 'relevance') THEN counted.score END DESC NULLS LAST,
  CASE WHEN normalized.safe_sort = 'top_rated' THEN counted.seller_rating END DESC NULLS LAST,
  CASE WHEN normalized.safe_sort = 'top_rated' THEN counted.seller_reviews END DESC NULLS LAST,
  CASE WHEN normalized.safe_sort = 'featured' THEN counted.is_featured END DESC NULLS LAST,
  CASE WHEN normalized.safe_sort = 'price_low' THEN counted.price END ASC NULLS LAST,
  CASE WHEN normalized.safe_sort = 'price_high' THEN counted.price END DESC NULLS LAST,
  CASE WHEN normalized.safe_sort = 'newest' THEN counted.created_at END DESC NULLS LAST,
  counted.created_at DESC,
  counted.id ASC
LIMIT (SELECT safe_limit FROM normalized)
OFFSET (SELECT safe_offset FROM normalized);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION marketplace_search_services IS 'Ranked, paginated service search with accurate top-rated, price, featured, and newest sorting.';
