import { z } from "zod";

export const registroSchema = z.object({
  nome: z.string().min(2).max(255),
  email: z.string().email().max(255),
  senha: z.string().min(8).max(100),
  perfil: z.enum(["comum", "sensei"]).default("comum"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export const avaliacaoSchema = z.object({
  dojoId: z.coerce.number().int().positive(),
  nota: z.coerce.number().int().min(1).max(5),
  descricao: z.string().max(2000).optional(),
});

export type RegistroInput = z.infer<typeof registroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AvaliacaoInput = z.infer<typeof avaliacaoSchema>;
