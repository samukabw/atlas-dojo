import { db } from "@/db";
import { avaliacoes, contatos, dojos, users } from "@/db/schema";

export async function limparBanco() {
  await db.delete(avaliacoes);
  await db.delete(contatos);
  await db.delete(dojos);
  await db.delete(users);
}
