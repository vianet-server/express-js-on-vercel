-- Extend app.email_marketing to store the full email campaign payload
-- created from the admin Email Marketing page.

ALTER TABLE app.email_marketing ADD COLUMN IF NOT EXISTS brand varchar(255);
ALTER TABLE app.email_marketing ADD COLUMN IF NOT EXISTS schedule varchar(50);
ALTER TABLE app.email_marketing ADD COLUMN IF NOT EXISTS include_detailed boolean;
ALTER TABLE app.email_marketing ADD COLUMN IF NOT EXISTS last_sent timestamptz;
