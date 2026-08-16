import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { globalBroadcastChannel } from '@/hooks/useAppRealtime';
import type { QueueStatusType, QueueStatus } from '../types';

const forceSync = () => {
  globalBroadcastChannel.send({ type: 'broadcast', event: 'force_sync', payload: {} });
};

async function saveManagerHistory(discord_id: string, manager_start_time: string) {
  console.log("SAVING MANAGER LOG...");
  const start = new Date(manager_start_time);
  const end = new Date();
  const durationMins = (end.getTime() - start.getTime()) / 60000; // Keep decimal for exact accumulation
  
  const { error: insertErr } = await supabase.from('queue_manager_logs').insert([{
    discord_id,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    duration_minutes: durationMins
  }]);

  if (insertErr) {
    console.error("ERROR INSERTING MANAGER LOG:", insertErr);
    throw new Error("Failed to save manager log: " + insertErr.message);
  }

  // === 2-HOUR BONUS LOGIC ===
  // 1. Get start of today (local time)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // 2. Sum manager time for today
  const { data: todayLogs, error: fetchErr } = await supabase
    .from('queue_manager_logs')
    .select('duration_minutes')
    .eq('discord_id', discord_id)
    .gte('start_time', todayStart.toISOString());
  
  if (fetchErr) {
    console.error("ERROR FETCHING TODAY LOGS:", fetchErr);
  }

  const totalTodayMins = (todayLogs || []).reduce((acc, log) => acc + (log.duration_minutes || 0), 0);
  const previousTotal = totalTodayMins - durationMins;

  // 3. Check if they just crossed the 120 mins (2 hrs) threshold
  if (previousTotal < 120 && totalTodayMins >= 120) {
    // Grant +2 Hours Bonus to Duty System
    const bonusStart = new Date();
    const bonusEnd = new Date(bonusStart.getTime() + 120 * 60000); // 2 hours later
    
    const { error: bonusErr } = await supabase.from('duty_logs').insert([{
      discord_id,
      status: 'completed',
      clock_in: bonusStart.toISOString(),
      clock_out: bonusEnd.toISOString(),
      total_break_minutes: 0,
      total_duty_minutes: 120
    }]);

    if (bonusErr) {
      console.error("ERROR INSERTING BONUS:", bonusErr);
    }
  }
}

const clearOtherQueued = async (excludeDiscordId: string) => {
  // Clear regular doctors
  await supabase.from('queue_status').delete().eq('status', 'queued').neq('discord_id', excludeDiscordId);
  
  // Clear volunteers
  const { data: setting } = await supabase.from('system_settings').select('value').eq('key', 'queue_volunteers').maybeSingle();
  if (setting?.value) {
    let volunteers: any[] = [];
    try { volunteers = JSON.parse(setting.value); } catch(e){}
    let changed = false;
    volunteers.forEach((v: any) => {
      if (v.status === 'queued' && v.id !== excludeDiscordId) {
        v.status = null;
        changed = true;
      }
    });
    if (changed) {
      await supabase.from('system_settings').upsert({
        key: 'queue_volunteers',
        value: JSON.stringify(volunteers),
        description: 'ข้อมูลหมออาสา',
        type: 'json'
      });
    }
  }
};

export function useQueueMutations() {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      discord_id, 
      newStatus, 
      currentStatusRecord 
    }: { 
      discord_id: string; 
      newStatus: QueueStatusType;
      currentStatusRecord: QueueStatus | null;
    }) => {
      // Handle Manager Leaving: Log their time
      if (currentStatusRecord?.status === 'manager' && newStatus !== 'manager' && currentStatusRecord.manager_start_time) {
        await saveManagerHistory(discord_id, currentStatusRecord.manager_start_time);
      }

      if (!newStatus) {
        console.log("ATTEMPTING TO UPDATE ROW FOR", discord_id, "TO NULL STATUS");
        // Instead of deleting, we update status to null to preserve story data
        const response = await supabase
          .from('queue_status')
          .update({
            status: null,
            manager_start_time: null,
            updated_at: new Date().toISOString()
          })
          .eq('discord_id', discord_id)
          .select();
        
        console.log("UPDATE RESPONSE:", response);
        if (response.error) throw response.error;
        if (response.data?.length === 0) {
          console.warn("UPDATE SUCCEEDED BUT 0 ROWS WERE UPDATED. THIS MEANS RLS BLOCKED IT OR ROW DOESN'T EXIST.");
        }
        return;
      }

      if (newStatus === 'queued') {
        await clearOtherQueued(discord_id);
      }

      // Handle entering Manager
      const manager_start_time = newStatus === 'manager' ? new Date().toISOString() : null;

      // Upsert the new status
      const { error } = await supabase
        .from('queue_status')
        .upsert({
          discord_id,
          status: newStatus,
          manager_start_time: newStatus === 'manager' ? manager_start_time : currentStatusRecord?.manager_start_time,
          updated_at: new Date().toISOString()
        }, { onConflict: 'discord_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue_users'] });
    },
    onError: (err: any) => {
      console.error('Failed to update status:', err);
      alert('Error updating status: ' + err.message);
    }
  });

  const updateStoryDetailsMutation = useMutation({
    mutationFn: async ({
      discord_id,
      targetTime,
      gang1,
      gang2,
      type
    }: {
      discord_id: string;
      targetTime: string;
      gang1: string;
      gang2: string;
      type: string;
    }) => {
      // Check if it should be locked immediately (time is in the past)
      const now = new Date();
      const [hh, mm] = targetTime.split(':').map(Number);
      const target = new Date();
      target.setHours(hh, mm, 0, 0);
      
      if (now.getTime() - target.getTime() > 12 * 60 * 60 * 1000) target.setDate(target.getDate() + 1);
      else if (target.getTime() - now.getTime() > 12 * 60 * 60 * 1000) target.setDate(target.getDate() - 1);
      
      const shouldLock = now >= target;

      if (shouldLock) {
        // Fetch current status to check if they are manager
        const { data: currentStatus } = await supabase
          .from('queue_status')
          .select('status, manager_start_time')
          .eq('discord_id', discord_id)
          .maybeSingle();
          
        if (currentStatus?.status === 'manager' && currentStatus.manager_start_time) {
          await saveManagerHistory(discord_id, currentStatus.manager_start_time);
        }

        // Force lock immediately
        const { error } = await supabase.from('queue_status').upsert({
          discord_id,
          status: 'story',
          story_target_time: targetTime,
          story_gang_1: gang1,
          story_gang_2: gang2,
          story_type: type,
          story_locked: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'discord_id' });
        if (error) throw error;
        return;
      }

      // First try to update existing row without touching status or lock
      const { data, error: updateErr } = await supabase
        .from('queue_status')
        .update({
          story_target_time: targetTime,
          story_gang_1: gang1,
          story_gang_2: gang2,
          story_type: type,
          updated_at: new Date().toISOString()
        })
        .eq('discord_id', discord_id)
        .select();

      if (updateErr) throw updateErr;

      // If row doesn't exist, insert it with 'story' status (NOT 'queued')
      if (data && data.length === 0) {
        const { error: insertErr } = await supabase
          .from('queue_status')
          .insert({
            discord_id,
            status: 'story',
            story_target_time: targetTime,
            story_gang_1: gang1,
            story_gang_2: gang2,
            story_type: type,
            story_locked: false,
            updated_at: new Date().toISOString()
          });
        
        if (insertErr) throw insertErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue_users'] });
    }
  });

  // When auto-tick triggers, lock the story status
  const lockStoryMutation = useMutation({
    mutationFn: async (discord_id: string) => {
      // Fetch current status to check if they are manager
      const { data: currentStatus } = await supabase
        .from('queue_status')
        .select('status, manager_start_time')
        .eq('discord_id', discord_id)
        .maybeSingle();
        
      if (currentStatus?.status === 'manager' && currentStatus.manager_start_time) {
        await saveManagerHistory(discord_id, currentStatus.manager_start_time);
      }

      const { error } = await supabase
        .from('queue_status')
        .update({
          status: 'story',
          story_locked: true,
          updated_at: new Date().toISOString()
        })
        .eq('discord_id', discord_id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue_users'] });
      
    }
  });

  // End or cancel a story
  const endStoryMutation = useMutation({
    mutationFn: async ({
      discord_id,
      statusRecord,
      saveToHistory
    }: {
      discord_id: string;
      statusRecord: QueueStatus | null;
      saveToHistory: boolean;
    }) => {
      // 1. Save to history if required
      if (saveToHistory && statusRecord?.story_locked && statusRecord?.story_target_time) {
        // Calculate start time based on the target time (e.g. "21:30")
        const now = new Date();
        const [hh, mm] = statusRecord.story_target_time.split(':').map(Number);
        
        let start = new Date();
        start.setHours(hh, mm, 0, 0);
        
        // If start time is in the future compared to now, it means it was actually from yesterday
        // (Midnight rollover fix)
        if (start > now) {
          start.setDate(start.getDate() - 1);
        }

        const durationMins = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60000));

        await supabase.from('story_logs').insert([{
          discord_id,
          gang_1: statusRecord.story_gang_1,
          gang_2: statusRecord.story_gang_2,
          story_type: statusRecord.story_type,
          story_target_time: statusRecord.story_target_time,
          start_time: start.toISOString(),
          end_time: now.toISOString(),
          duration_minutes: durationMins
        }]);
      }

      // If they don't have a status record, there's nothing to clear
      if (!statusRecord) return;

      // 2. Clear story details
      if (statusRecord.status === 'story') {
        // If they were 'story', ending the story means they are done.
        // Delete their row so they don't get randomly ticked into 'queued'.
        const { error } = await supabase
          .from('queue_status')
          .delete()
          .eq('discord_id', discord_id);
          
        if (error) throw error;
      } else {
        // If they were something else (e.g. 'manager'), just clear the story fields and keep their status.
        const { error } = await supabase
          .from('queue_status')
          .update({
            story_target_time: null,
            story_gang_1: null,
            story_gang_2: null,
            story_type: null,
            story_locked: false,
            story_premium: null,
            updated_at: new Date().toISOString()
          })
          .eq('discord_id', discord_id);
          
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue_users'] });
    }
  });

  const addStoryLogMutation = useMutation({
    mutationFn: async (newStory: {
      discord_id: string;
      gang_1: string | null;
      gang_2: string | null;
      story_type: string | null;
      start_time: string;
      end_time?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('story_logs')
        .insert([newStory])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue_users'] });
    },
    onError: (err: any) => {
      console.error('Failed to add story log:', err);
      alert('Error adding story log: ' + err.message);
    }
  });

  const updateStoryLogMutation = useMutation({
    mutationFn: async (updatedStory: {
      id: string;
      discord_id: string;
      gang_1: string | null;
      gang_2: string | null;
      story_type: string | null;
      start_time: string;
      end_time?: string | null;
    }) => {
      const { id, ...updates } = updatedStory;
      const { data, error } = await supabase
        .from('story_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue_users'] });
    },
    onError: (err: any) => {
      console.error('Failed to update story log:', err);
      alert('Error updating story log: ' + err.message);
    }
  });

  const deleteStoryLogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('story_logs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue_users'] });
      queryClient.invalidateQueries({ queryKey: ['story_logs'] });
    }
  });

  const addVolunteerMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: setting } = await supabase.from('system_settings').select('value').eq('key', 'queue_volunteers').maybeSingle();
      let volunteers: any[] = [];
      if (setting?.value) {
        try { volunteers = JSON.parse(setting.value); } catch(e){}
      }
      volunteers.push({
        id: `vol_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        name,
        status: null,
        added_at: new Date().toISOString()
      });
      await supabase.from('system_settings').upsert({
        key: 'queue_volunteers',
        value: JSON.stringify(volunteers),
        description: 'รายชื่อหมออาสา',
        type: 'json'
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['queue_users'] });  }
  });

  const updateVolunteerMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string, newStatus: QueueStatusType | null }) => {
      if (newStatus === 'queued') {
        await clearOtherQueued(id);
      }
      
      const { data: setting } = await supabase.from('system_settings').select('value').eq('key', 'queue_volunteers').maybeSingle();
      if (!setting?.value) return;
      let volunteers: any[] = [];
      try { volunteers = JSON.parse(setting.value); } catch(e){}
      const v = volunteers.find((x: any) => x.id === id);
      if (v) {
        v.status = newStatus;
        await supabase.from('system_settings').upsert({
          key: 'queue_volunteers',
          value: JSON.stringify(volunteers),
          description: 'รายชื่อหมออาสา',
          type: 'json'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue_users'] });
      
    }
  });

  const removeVolunteerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: setting } = await supabase.from('system_settings').select('value').eq('key', 'queue_volunteers').maybeSingle();
      if (!setting?.value) return;
      let volunteers: any[] = [];
      try { volunteers = JSON.parse(setting.value); } catch(e){}
      volunteers = volunteers.filter((x: any) => x.id !== id);
      await supabase.from('system_settings').upsert({
        key: 'queue_volunteers',
        value: JSON.stringify(volunteers),
        description: 'รายชื่อหมออาสา',
        type: 'json'
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['queue_users'] });  }
  });

  return {
    updateStatus: updateStatusMutation.mutateAsync,
    updateStoryDetails: updateStoryDetailsMutation.mutateAsync,
    lockStory: lockStoryMutation.mutateAsync,
    endStory: endStoryMutation.mutateAsync,
    addStoryLog: addStoryLogMutation.mutateAsync,
    updateStoryLog: updateStoryLogMutation.mutateAsync,
    deleteStoryLog: deleteStoryLogMutation.mutateAsync,
    addVolunteer: addVolunteerMutation.mutateAsync,
    updateVolunteer: updateVolunteerMutation.mutateAsync,
    removeVolunteer: removeVolunteerMutation.mutateAsync
  };
}
