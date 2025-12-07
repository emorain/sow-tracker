/**
 * Notification Service
 * Handles creating and scheduling notifications for various farm events
 */

import { supabase } from '@/lib/supabase';

export type NotificationType =
  | 'farrowing'
  | 'breeding'
  | 'pregnancy_check'
  | 'weaning'
  | 'vaccination'
  | 'health'
  | 'task'
  | 'transfer'
  | 'compliance'
  | 'matrix';

type NotificationData = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string | null;
  relatedId?: string | null;
};

type ScheduledNotificationData = NotificationData & {
  scheduledFor: Date;
};

/**
 * Send an immediate notification
 */
export async function sendNotification(data: NotificationData) {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link_url: data.linkUrl || null,
      related_id: data.relatedId || null,
      sent_at: new Date().toISOString(),
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error };
  }
}

/**
 * Schedule a notification for future delivery
 */
export async function scheduleNotification(data: ScheduledNotificationData) {
  try {
    const { error } = await supabase.from('scheduled_notifications').insert({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link_url: data.linkUrl || null,
      related_id: data.relatedId || null,
      scheduled_for: data.scheduledFor.toISOString(),
      sent: false,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return { success: false, error };
  }
}

/**
 * Cancel scheduled notifications for a specific item
 */
export async function cancelScheduledNotifications(userId: string, relatedId: string) {
  try {
    const { error } = await supabase
      .from('scheduled_notifications')
      .delete()
      .eq('user_id', userId)
      .eq('related_id', relatedId)
      .eq('sent', false);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error canceling scheduled notifications:', error);
    return { success: false, error };
  }
}

/**
 * Schedule farrowing reminder notifications
 */
export async function scheduleFarrowingReminders(
  farrowingId: string,
  sowEarTag: string,
  expectedDate: Date,
  userId: string
) {
  try {
    // Get user's notification preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('farrowing_reminder_days, notify_farrowing')
      .eq('user_id', userId)
      .single();

    if (!prefs?.notify_farrowing) {
      return { success: true, message: 'Farrowing notifications disabled' };
    }

    const reminderDays = prefs.farrowing_reminder_days || [7, 3, 1];

    // Schedule notifications for each reminder day
    for (const days of reminderDays) {
      const scheduledDate = new Date(expectedDate);
      scheduledDate.setDate(scheduledDate.getDate() - days);

      // Only schedule if in the future
      if (scheduledDate > new Date()) {
        await scheduleNotification({
          userId,
          type: 'farrowing',
          title: `Farrowing Alert: ${sowEarTag}`,
          message: `Sow ${sowEarTag} is expected to farrow in ${days} day${days !== 1 ? 's' : ''}`,
          linkUrl: `/farrowings/active`,
          relatedId: farrowingId,
          scheduledFor: scheduledDate,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error scheduling farrowing reminders:', error);
    return { success: false, error };
  }
}

/**
 * Schedule pregnancy check reminder
 */
export async function schedulePregnancyCheckReminder(
  breedingId: string,
  sowEarTag: string,
  checkDate: Date,
  userId: string
) {
  try {
    // Get user's notification preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('pregnancy_check_reminder_days, notify_pregnancy_check')
      .eq('user_id', userId)
      .single();

    if (!prefs?.notify_pregnancy_check) {
      return { success: true, message: 'Pregnancy check notifications disabled' };
    }

    const reminderDays = prefs.pregnancy_check_reminder_days || [1];

    for (const days of reminderDays) {
      const scheduledDate = new Date(checkDate);
      scheduledDate.setDate(scheduledDate.getDate() - days);

      if (scheduledDate > new Date()) {
        await scheduleNotification({
          userId,
          type: 'pregnancy_check',
          title: `Pregnancy Check Due: ${sowEarTag}`,
          message: `Sow ${sowEarTag} pregnancy check is due in ${days} day${days !== 1 ? 's' : ''}`,
          linkUrl: `/sows`,
          relatedId: breedingId,
          scheduledFor: scheduledDate,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error scheduling pregnancy check reminder:', error);
    return { success: false, error };
  }
}

/**
 * Schedule weaning reminder
 */
export async function scheduleWeaningReminder(
  farrowingId: string,
  sowEarTag: string,
  weaningDate: Date,
  userId: string
) {
  try {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('weaning_reminder_days, notify_weaning')
      .eq('user_id', userId)
      .single();

    if (!prefs?.notify_weaning) {
      return { success: true, message: 'Weaning notifications disabled' };
    }

    const reminderDays = prefs.weaning_reminder_days || [3, 1];

    for (const days of reminderDays) {
      const scheduledDate = new Date(weaningDate);
      scheduledDate.setDate(scheduledDate.getDate() - days);

      if (scheduledDate > new Date()) {
        await scheduleNotification({
          userId,
          type: 'weaning',
          title: `Weaning Due: ${sowEarTag}`,
          message: `Litter from ${sowEarTag} is due for weaning in ${days} day${days !== 1 ? 's' : ''}`,
          linkUrl: `/farrowings/active`,
          relatedId: farrowingId,
          scheduledFor: scheduledDate,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error scheduling weaning reminder:', error);
    return { success: false, error };
  }
}

/**
 * Send breeding notification
 */
export async function sendBreedingNotification(
  breedingId: string,
  sowEarTag: string,
  boarEarTag: string,
  userId: string
) {
  try {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('notify_breeding')
      .eq('user_id', userId)
      .single();

    if (!prefs?.notify_breeding) {
      return { success: true, message: 'Breeding notifications disabled' };
    }

    await sendNotification({
      userId,
      type: 'breeding',
      title: 'New Breeding Recorded',
      message: `Sow ${sowEarTag} bred with boar ${boarEarTag}`,
      linkUrl: `/sows`,
      relatedId: breedingId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending breeding notification:', error);
    return { success: false, error };
  }
}

/**
 * Send health record notification
 */
export async function sendHealthRecordNotification(
  healthRecordId: string,
  animalEarTag: string,
  recordType: string,
  userId: string
) {
  try {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('notify_health_records')
      .eq('user_id', userId)
      .single();

    if (!prefs?.notify_health_records) {
      return { success: true, message: 'Health record notifications disabled' };
    }

    await sendNotification({
      userId,
      type: 'health',
      title: `Health Record: ${animalEarTag}`,
      message: `New ${recordType} record added for ${animalEarTag}`,
      linkUrl: `/health`,
      relatedId: healthRecordId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending health record notification:', error);
    return { success: false, error };
  }
}

/**
 * Send task reminder notification
 */
export async function sendTaskReminder(
  taskId: string,
  taskTitle: string,
  dueDate: Date,
  userId: string
) {
  try {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('notify_tasks')
      .eq('user_id', userId)
      .single();

    if (!prefs?.notify_tasks) {
      return { success: true, message: 'Task notifications disabled' };
    }

    const today = new Date();
    const isOverdue = dueDate < today;

    await sendNotification({
      userId,
      type: 'task',
      title: isOverdue ? 'Overdue Task' : 'Task Reminder',
      message: isOverdue
        ? `Task "${taskTitle}" is overdue`
        : `Task "${taskTitle}" is due today`,
      linkUrl: `/tasks`,
      relatedId: taskId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending task reminder:', error);
    return { success: false, error };
  }
}

/**
 * Send vaccination reminder
 */
export async function scheduleVaccinationReminder(
  healthRecordId: string,
  animalEarTag: string,
  vaccinationDate: Date,
  vaccinationType: string,
  userId: string
) {
  try {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('vaccination_reminder_days, notify_vaccination')
      .eq('user_id', userId)
      .single();

    if (!prefs?.notify_vaccination) {
      return { success: true, message: 'Vaccination notifications disabled' };
    }

    const reminderDays = prefs.vaccination_reminder_days || [7, 3, 1];

    for (const days of reminderDays) {
      const scheduledDate = new Date(vaccinationDate);
      scheduledDate.setDate(scheduledDate.getDate() - days);

      if (scheduledDate > new Date()) {
        await scheduleNotification({
          userId,
          type: 'vaccination',
          title: `Vaccination Due: ${animalEarTag}`,
          message: `${vaccinationType} vaccination for ${animalEarTag} is due in ${days} day${days !== 1 ? 's' : ''}`,
          linkUrl: `/health`,
          relatedId: healthRecordId,
          scheduledFor: scheduledDate,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error scheduling vaccination reminder:', error);
    return { success: false, error };
  }
}

/**
 * Send compliance alert
 */
export async function sendComplianceAlert(
  sowId: string,
  sowEarTag: string,
  message: string,
  userId: string
) {
  try {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('notify_compliance')
      .eq('user_id', userId)
      .single();

    if (!prefs?.notify_compliance) {
      return { success: true, message: 'Compliance notifications disabled' };
    }

    await sendNotification({
      userId,
      type: 'compliance',
      title: `Compliance Alert: ${sowEarTag}`,
      message,
      linkUrl: `/compliance`,
      relatedId: sowId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending compliance alert:', error);
    return { success: false, error };
  }
}
