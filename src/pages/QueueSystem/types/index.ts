export type QueueStatusType = 'unavailable' | 'queued' | 'manager' | 'story' | null;

export interface QueueStatus {
  discord_id: string;
  status: NonNullable<QueueStatusType>;
  manager_start_time: string | null;
  story_target_time: string | null;
  story_gang_1: string | null;
  story_gang_2: string | null;
  story_type: string | null;
  story_locked: boolean;
  story_premium: number | null;
  updated_at: string;
}

export interface QueueManagerLog {
  id: string;
  discord_id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface StoryLog {
  id: string;
  discord_id: string;
  gang_1: string | null;
  gang_2: string | null;
  story_type: string | null;
  story_target_time: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  created_at: string;
}

// Extending user profile for display in queue
export interface QueueUser {
  discord_id: string;
  ic_name: string;
  avatar_url: string | null;
  is_current_user: boolean;
  status_record: QueueStatus | null;
}
