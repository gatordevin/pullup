export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      locations: {
        Row: {
          id: string;
          name: string;
          latitude: number;
          longitude: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          latitude: number;
          longitude: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          latitude?: number;
          longitude?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          preferred_sport: "pickleball" | "spikeball" | "running" | "volleyball" | "climbing" | "soccer" | "football" | "basketball" | "frisbee" | "tennis" | "badminton" | null;
          skill_level: "beginner" | "intermediate" | "advanced" | "any" | "expert" | "v0-v3" | "v4-v6" | "v7-v10" | "v11plus" | "ntrp-2.5" | "ntrp-3.0" | "ntrp-3.5" | "ntrp-4.0" | "ntrp-4.5plus" | null;
          favorite_location_id: string | null;
          expo_push_token: string | null;
          avatar_url: string | null;
          email: string | null;
          is_guest: boolean;
          onboarded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          preferred_sport?: "pickleball" | "spikeball" | "running" | "volleyball" | "climbing" | "soccer" | "football" | "basketball" | "frisbee" | "tennis" | "badminton" | null;
          skill_level?: "beginner" | "intermediate" | "advanced" | "any" | "expert" | "v0-v3" | "v4-v6" | "v7-v10" | "v11plus" | "ntrp-2.5" | "ntrp-3.0" | "ntrp-3.5" | "ntrp-4.0" | "ntrp-4.5plus" | null;
          favorite_location_id?: string | null;
          expo_push_token?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          is_guest?: boolean;
          onboarded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          preferred_sport?: "pickleball" | "spikeball" | "running" | "volleyball" | "climbing" | "soccer" | "football" | "basketball" | "frisbee" | "tennis" | "badminton" | null;
          skill_level?: "beginner" | "intermediate" | "advanced" | "any" | "expert" | "v0-v3" | "v4-v6" | "v7-v10" | "v11plus" | "ntrp-2.5" | "ntrp-3.0" | "ntrp-3.5" | "ntrp-4.0" | "ntrp-4.5plus" | null;
          favorite_location_id?: string | null;
          expo_push_token?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          is_guest?: boolean;
          onboarded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_favorite_location_id_fkey";
            columns: ["favorite_location_id"];
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
      };
      games: {
        Row: {
          id: string;
          host_id: string;
          sport: "pickleball" | "spikeball" | "running" | "volleyball" | "climbing" | "soccer" | "football" | "basketball" | "frisbee" | "tennis" | "badminton";
          skill_level: "beginner" | "intermediate" | "advanced" | "any" | "expert" | "v0-v3" | "v4-v6" | "v7-v10" | "v11plus" | "ntrp-2.5" | "ntrp-3.0" | "ntrp-3.5" | "ntrp-4.0" | "ntrp-4.5plus";
          location_id: string | null;
          starts_at: string;
          max_players: number;
          current_players: number;
          status: "open" | "full" | "started" | "cancelled" | "completed";
          notes: string | null;
          has_equipment: boolean;
          extra_equipment: boolean;
          time_flexible: boolean;
          distance_miles: number | null;
          pace: string | null;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          sport: "pickleball" | "spikeball" | "running" | "volleyball" | "climbing" | "soccer" | "football" | "basketball" | "frisbee" | "tennis" | "badminton";
          skill_level?: "beginner" | "intermediate" | "advanced" | "any" | "expert" | "v0-v3" | "v4-v6" | "v7-v10" | "v11plus" | "ntrp-2.5" | "ntrp-3.0" | "ntrp-3.5" | "ntrp-4.0" | "ntrp-4.5plus";
          location_id?: string | null;
          starts_at: string;
          max_players: number;
          current_players?: number;
          status?: "open" | "full" | "started" | "cancelled" | "completed";
          notes?: string | null;
          has_equipment?: boolean;
          extra_equipment?: boolean;
          time_flexible?: boolean;
          distance_miles?: number | null;
          pace?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          host_id?: string;
          sport?: "pickleball" | "spikeball" | "running" | "volleyball" | "climbing" | "soccer" | "football" | "basketball" | "frisbee" | "tennis" | "badminton";
          skill_level?: "beginner" | "intermediate" | "advanced" | "any" | "expert" | "v0-v3" | "v4-v6" | "v7-v10" | "v11plus" | "ntrp-2.5" | "ntrp-3.0" | "ntrp-3.5" | "ntrp-4.0" | "ntrp-4.5plus";
          location_id?: string | null;
          starts_at?: string;
          max_players?: number;
          current_players?: number;
          status?: "open" | "full" | "started" | "cancelled" | "completed";
          notes?: string | null;
          has_equipment?: boolean;
          extra_equipment?: boolean;
          time_flexible?: boolean;
          distance_miles?: number | null;
          pace?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "games_host_id_fkey";
            columns: ["host_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_location_id_fkey";
            columns: ["location_id"];
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
      };
      game_participants: {
        Row: {
          id: string;
          game_id: string;
          user_id: string;
          status: "joined" | "left";
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          user_id: string;
          status?: "joined" | "left";
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          user_id?: string;
          status?: "joined" | "left";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_participants_game_id_fkey";
            columns: ["game_id"];
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_participants_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          game_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_game_id_fkey";
            columns: ["game_id"];
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: "pending" | "accepted" | "declined";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "friendships_requester_id_fkey";
            columns: ["requester_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "friendships_addressee_id_fkey";
            columns: ["addressee_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      sport_type: "pickleball" | "spikeball" | "running" | "volleyball" | "climbing" | "soccer" | "football" | "basketball" | "frisbee" | "tennis" | "badminton";
      skill_level_type: "beginner" | "intermediate" | "advanced" | "any" | "expert" | "v0-v3" | "v4-v6" | "v7-v10" | "v11plus" | "ntrp-2.5" | "ntrp-3.0" | "ntrp-3.5" | "ntrp-4.0" | "ntrp-4.5plus";
      game_status_type: "open" | "full" | "started" | "cancelled" | "completed";
      participant_status_type: "joined" | "left";
      friendship_status: "pending" | "accepted" | "declined";
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Location = Tables<"locations">;
export type Profile = Tables<"profiles">;
export type Game = Tables<"games">;
export type GameParticipant = Tables<"game_participants">;
export type Message = Tables<"messages">;

export type Friendship = Tables<"friendships">;

export type GameWithLocation = Game & { locations: Location | null };
