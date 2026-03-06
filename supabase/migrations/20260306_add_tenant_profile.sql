-- Tenant profile: business info + SEO customization
ALTER TABLE tenants
  ADD COLUMN description text,
  ADD COLUMN category text NOT NULL DEFAULT 'LocalBusiness',
  ADD COLUMN city text,
  ADD COLUMN address text,
  ADD COLUMN phone text,
  ADD COLUMN seo_title text,
  ADD COLUMN seo_description text;
