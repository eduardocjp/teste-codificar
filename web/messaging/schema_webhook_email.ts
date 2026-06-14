import { z } from "zod";

export const schemaEnderecoEmailPostmark = z.object({
  Email: z.string().email().optional(),
  Name: z.string().nullable().optional(),
  MailboxHash: z.string().nullable().optional(),
}).passthrough();

export const schemaCabecalhoEmailPostmark = z.object({
  Name: z.string().min(1),
  Value: z.string().optional().default(""),
}).passthrough();

export const schemaAnexoEmailPostmark = z.object({
  Name: z.string().optional(),
  ContentType: z.string().optional(),
  ContentLength: z.number().int().nonnegative().optional(),
  ContentID: z.string().nullable().optional(),
  Content: z.string().optional(),
}).passthrough();

export const schemaWebhookEmailPostmark = z.object({
  MessageID: z.string().min(1),
  From: z.string().email(),
  FromName: z.string().nullable().optional(),
  FromFull: schemaEnderecoEmailPostmark.optional(),
  To: z.string().min(1),
  ToFull: z.array(schemaEnderecoEmailPostmark).optional().default([]),
  Subject: z.string().nullable().optional(),
  TextBody: z.string().nullable().optional(),
  HtmlBody: z.string().nullable().optional(),
  StrippedTextReply: z.string().nullable().optional(),
  MailboxHash: z.string().nullable().optional(),
  Date: z.string().nullable().optional(),
  Headers: z.array(schemaCabecalhoEmailPostmark).optional().default([]),
  Attachments: z.array(schemaAnexoEmailPostmark).optional().default([]),
}).passthrough();

export type PayloadWebhookEmailPostmark = z.infer<typeof schemaWebhookEmailPostmark>;
