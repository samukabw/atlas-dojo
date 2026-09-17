import { db } from "@/db";
import { dojos, contatos } from "@/db/schema";

async function main() {
  const dados = [
    { nome: "Academia Sé Karatê", descricao: "Karatê Shotokan no centro.", cep: "01001-000",
      cidade: "São Paulo", bairro: "Sé", rua: "Praça da Sé", numero: "100",
      latitude: "-23.5505", longitude: "-46.6333" },
    { nome: "Dojo Paulista Judô", descricao: "Judô para todas as idades.", cep: "01310-100",
      cidade: "São Paulo", bairro: "Bela Vista", rua: "Av. Paulista", numero: "1500",
      latitude: "-23.5617", longitude: "-46.6560" },
    { nome: "Rio Jiu-Jitsu Centro", descricao: "BJJ no centro do Rio.", cep: "20040-002",
      cidade: "Rio de Janeiro", bairro: "Centro", rua: "Av. Rio Branco", numero: "1",
      latitude: "-22.9068", longitude: "-43.1729" },
  ];

  for (const d of dados) {
    const [inserido] = await db.insert(dojos).values(d).returning();
    await db.insert(contatos).values({
      dojoId: inserido.id, telefone: "(11) 90000-0000", email: "contato@dojo.com",
    });
  }
  console.log("Seed concluído.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
