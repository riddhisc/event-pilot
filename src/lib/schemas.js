import { z } from 'zod';

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required'),
    description: z.string().trim().min(1, 'Description is required'),
    starts_at: z.string().min(1, 'Start is required'),
    ends_at: z.string().min(1, 'End is required'),
    timezone: z.string().min(1, 'Timezone is required').default('America/New_York'),
    location: z.string().trim().optional().default(''),
    meeting_url: z.string().trim().optional().default(''),
    capacity: z.coerce.number().int().positive('Capacity must be at least 1'),
    waitlist_enabled: z.boolean().optional().default(true),
    type: z.enum(['in_person', 'virtual', 'hybrid']),
    status: z.enum(['draft', 'published', 'cancelled', 'completed']),
    recurrence_rule: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (new Date(value.ends_at) <= new Date(value.starts_at)) {
      ctx.addIssue({ code: 'custom', path: ['ends_at'], message: 'End must be after start' });
    }
    if (value.type !== 'virtual' && !value.location) {
      ctx.addIssue({ code: 'custom', path: ['location'], message: 'Location is required' });
    }
    if (value.type !== 'in_person' && !value.meeting_url) {
      ctx.addIssue({ code: 'custom', path: ['meeting_url'], message: 'Meeting link is required' });
    }
  });

export const tenantSettingsSchema = z.object({
  eventTypes: z.array(z.enum(['in_person', 'virtual', 'hybrid'])).min(1),
  approvalRequired: z.boolean(),
  departments: z.array(z.string().min(1)).min(1),
  workingHours: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  branding: z.object({
    brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  notificationTemplates: z.object({
    reminder: z.string().min(1),
  }),
});

export const featureFlagsSchema = z.object({
  aiAssist: z.boolean(),
  waitlist: z.boolean(),
  reminders: z.boolean(),
  recurringEvents: z.boolean(),
});

export const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});
