import { generateDiagnosticResponse } from "./lib/diagnostic-mock-data";

async function seedResponses() {
  const token = "empresa-teste-58b6ad2069ddbb46";
  const baseUrl = "http://localhost:3000";
  const count = 35;

  console.log(`Iniciando seed de ${count} respostas...\n`);

  for (let i = 0; i < count; i++) {
    const response = generateDiagnosticResponse(i);

    try {
      const res = await fetch(`${baseUrl}/api/public/diagnostic/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      });

      if (res.ok) {
        console.log(`✓ Resposta ${i + 1}/${count}: ${response.fullName} (${response.area})`);
      } else {
        const error = await res.json();
        console.log(`✗ Resposta ${i + 1}/${count}: ${error.error}`);
      }
    } catch {
      console.log(`✗ Resposta ${i + 1}/${count}: Erro de conexão`);
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  console.log("\nSeed concluído!");
}

seedResponses();
