// packages/agent-state/src/types.ts
import { z } from 'zod';

// Session status enum - using Schema suffix to avoid redeclaration
export const SessionStatusSchema = z.enum(['active', 'completed', 'error']);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

// Tool call status enum - using Schema suffix to avoid redeclaration
export const ToolCallStatusSchema = z.enum(['pending', 'running', 'completed', 'error']);
export type ToolCallStatus = z.infer<typeof ToolCallStatusSchema>;

// Session configuration
export const SessionConfigSchema = z
  .object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional(),
    agentRole: z.string().optional(),
    systemPrompt: z.string().optional(),
  })
  .passthrough();

export type SessionConfig = z.infer<typeof SessionConfigSchema>;

// Message schema (user or assistant)
export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  reasoning: z.string().optional(),
});

export type Message = z.infer<typeof MessageSchema>;

// Tool call schema
export const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  args: z.record(z.string(), z.unknown()),
  result: z.unknown().optional(),
  status: ToolCallStatusSchema,
  startedAt: z.number(),
  completedAt: z.number().optional(),
  error: z.string().optional(),
});

export type ToolCall = z.infer<typeof ToolCallSchema>;

// Session schema
export const SessionSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.number(),
  updatedAt: z.number(),
  title: z.string().optional(),
  model: z.string(),
  region: z.string(),
  status: SessionStatusSchema,
  config: SessionConfigSchema.optional(),
});

export type Session = z.infer<typeof SessionSchema>;

// Turn schema
export const TurnSchema = z.object({
  id: z.string(),
  sessionId: z.string().uuid(),
  turnNumber: z.number().int().positive(),
  createdAt: z.number(),
  userMessage: MessageSchema,
  assistantResponse: MessageSchema.optional(),
  toolCalls: z.array(ToolCallSchema),
  tokensUsed: z.number().int().nonnegative().optional(),
  costUsd: z.number().nonnegative().optional(),
  error: z.string().nullable(),
});

export type Turn = z.infer<typeof TurnSchema>;
