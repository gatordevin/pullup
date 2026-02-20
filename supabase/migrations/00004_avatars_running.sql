-- Profile pictures
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Running-specific game fields
ALTER TABLE games ADD COLUMN IF NOT EXISTS distance_miles numeric;
ALTER TABLE games ADD COLUMN IF NOT EXISTS pace text;
