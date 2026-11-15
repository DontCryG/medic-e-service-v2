export type QueueStatusType = 'unavailable' | 'queued' | 'manager' | null;

export interface QueueStatus {
  discord_id: string;
  status: NonNullable<QueueStatusType>;
  manager_start_time: string | null;
  remark: string | null;
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

// Extending user profile for display in queue
export interface QueueUser {
  discord_id: string;
  ic_name: string;
  avatar_url: string | null;
  is_current_user: boolean;
  is_volunteer?: boolean;
  volunteer_added_at?: string;
  status_record: QueueStatus | null;
}
