import { z } from 'zod';

export const createAccountSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('COACH'),
    phone: z.string().min(9, 'رقم الجوال غير صالح'),
    password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    teamId: z.string().optional().nullable(),
  }),
  z.object({
    role: z.literal('PLAYER'),
    phone: z.string().min(9, 'رقم الجوال غير صالح'),
    password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    teamId: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
  }),
]);

export const createTeamSchema = z.object({
  name: z.string().min(2, 'اسم الفريق يجب أن يكون حرفين على الأقل'),
  description: z.string().optional().nullable(),
});

export const updateTeamSchema = createTeamSchema.partial();

export const updatePlayerSchema = z.object({
  name: z.string().min(2).optional(),
  dateOfBirth: z.string().optional().nullable(),
  position: z.enum(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD']).optional().nullable(),
  phone: z.string().optional().nullable(),
  guardianName: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  subscriptionEnd: z.string().optional().nullable(), // ISO date string
});

export const updateCoachSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  teamIds: z.array(z.string()).optional(), // multi-team assignment
  photoUrl: z.string().optional().nullable(),
});

export const updateAttributesSchema = z.object({
  speed: z.number().int().min(1).max(10).optional(),
  passing: z.number().int().min(1).max(10).optional(),
  shooting: z.number().int().min(1).max(10).optional(),
  dribbling: z.number().int().min(1).max(10).optional(),
  defense: z.number().int().min(1).max(10).optional(),
  stamina: z.number().int().min(1).max(10).optional(),
});

export const createNoteSchema = z.object({
  content: z
    .string()
    .min(5, 'الملاحظة يجب أن تكون 5 أحرف على الأقل')
    .max(1000, 'الملاحظة يجب ألا تتجاوز 1000 حرف'),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type CreateCoachInput = Extract<CreateAccountInput, { role: 'COACH' }>;
export type CreatePlayerInput = Extract<CreateAccountInput, { role: 'PLAYER' }>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
export type UpdateCoachInput = z.infer<typeof updateCoachSchema>;
export type UpdateAttributesInput = z.infer<typeof updateAttributesSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'U21'] as const;
export type AgeGroup = typeof AGE_GROUPS[number];

export const createAcademySchema = z.object({
  name: z.string().min(2, 'اسم الأكاديمية يجب أن يكون حرفين على الأقل'),
  city: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  ageGroups: z.array(z.enum(AGE_GROUPS)).min(1, 'يجب اختيار فئة عمرية واحدة على الأقل'),
});

export const updateAcademySchema = createAcademySchema.partial();

export const createMatchRequestSchema = z.object({
  toAcademyId: z.string().min(1, 'الأكاديمية المستقبلة مطلوبة'),
  ageGroup: z.enum(AGE_GROUPS),
  proposedDate: z.string().min(1, 'التاريخ المقترح مطلوب'),
  location: z.string().optional().nullable(),
  homeOrAway: z.enum(['HOME', 'AWAY']),
  notes: z.string().optional().nullable(),
});

export const createAdminUserSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  mobile: z.string().min(9, 'رقم الجوال غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  academyId: z.string().min(1, 'الأكاديمية مطلوبة'),
});

export type CreateAcademyInput = z.infer<typeof createAcademySchema>;
export type UpdateAcademyInput = z.infer<typeof updateAcademySchema>;
export type CreateMatchRequestInput = z.infer<typeof createMatchRequestSchema>;
export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
