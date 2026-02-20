-- Add running and volleyball to the sport_type enum
ALTER TYPE sport_type ADD VALUE IF NOT EXISTS 'running';
ALTER TYPE sport_type ADD VALUE IF NOT EXISTS 'volleyball';
