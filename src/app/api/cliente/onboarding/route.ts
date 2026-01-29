import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { onboardingService } from "@/services/onboarding.service";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as { companyId?: string };
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário não vinculado a empresa" }, { status: 400 });
    }

    const steps = await onboardingService.getByCompany(user.companyId);
    const progress = await onboardingService.getProgress(user.companyId);

    return NextResponse.json({
      steps: steps.map((step) => ({
        id: step.id,
        type: step.type,
        title: step.title,
        description: step.description,
        status: step.status,
        order: step.order,
        completedAt: step.completedAt,
        dueDate: step.dueDate,
        metadata: step.metadata,
      })),
      progress,
    });
  } catch (error) {
    console.error("Erro ao buscar onboarding:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}
