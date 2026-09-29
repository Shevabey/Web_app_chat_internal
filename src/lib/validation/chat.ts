import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

export const registerSchema = z
  .object({
    display_name: z.string().trim().min(1).max(60),
    email: z.string().email(),
    password: z.string().min(8),
    password_confirmation: z.string().min(1),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Password dan konfirmasi password harus sama.',
    path: ['password_confirmation'],
  });

export const sendMessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

export const startConversationSchema = z.object({
  otherUserId: z.string().uuid(),
});

export const searchUsersSchema = z.object({
  query: z.string().trim().min(1).max(50),
});

export const loadOlderSchema = z.object({
  conversationId: z.string().uuid(),
  before: z.string().datetime(),
});

export const markReadSchema = z.object({
  conversationId: z.string().uuid(),
});
