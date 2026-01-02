-- Migration: Customize food tracker for personal use
-- Changes:
-- 1. Rename meal_type to category
-- 2. Rename price_per_person to total_price
-- 3. Remove recommended_for column
-- 4. Update items_ordered to jsonb for structured data
-- 5. Change default currency to USD

-- Rename meal_type to category
ALTER TABLE food_entries RENAME COLUMN meal_type TO category;

-- Rename price_per_person to total_price
ALTER TABLE food_entries RENAME COLUMN price_per_person TO total_price;

-- Remove recommended_for column
ALTER TABLE food_entries DROP COLUMN IF EXISTS recommended_for;

-- Convert items_ordered from text[] to jsonb for structured data (name, price, image_url)
ALTER TABLE food_entries ALTER COLUMN items_ordered TYPE jsonb USING 
  CASE 
    WHEN items_ordered IS NULL THEN NULL
    ELSE (SELECT jsonb_agg(jsonb_build_object('name', item, 'price', NULL, 'image_url', NULL)) 
          FROM unnest(items_ordered) AS item)
  END;

-- Change default currency to USD
ALTER TABLE food_entries ALTER COLUMN currency SET DEFAULT 'USD';

-- Update existing entries to USD if they're THB
UPDATE food_entries SET currency = 'USD' WHERE currency = 'THB' OR currency IS NULL;
