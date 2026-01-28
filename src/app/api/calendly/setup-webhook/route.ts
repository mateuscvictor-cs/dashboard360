import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";

const CALENDLY_API_KEY = process.env.CALENDLY_API_KEY;
const CALENDLY_BASE_URL = "https://api.calendly.com";

async function calendlyFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${CALENDLY_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CALENDLY_API_KEY}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Calendly API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function GET() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const userResponse = await calendlyFetch<{
      resource: { uri: string; current_organization: string };
    }>("/users/me");

    const organizationUri = userResponse.resource.current_organization;

    const webhooksResponse = await calendlyFetch<{
      collection: Array<{
        uri: string;
        callback_url: string;
        events: string[];
        scope: string;
        state: string;
        created_at: string;
      }>;
    }>(`/webhook_subscriptions?organization=${encodeURIComponent(organizationUri)}&scope=organization`);

    return NextResponse.json({
      organizationUri,
      webhooks: webhooksResponse.collection,
    });
  } catch (error) {
    console.error("[Calendly] Error fetching webhooks:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar webhooks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const webhookUrl = body.url;

    if (!webhookUrl) {
      return NextResponse.json({ error: "URL do webhook é obrigatória" }, { status: 400 });
    }

    const userResponse = await calendlyFetch<{
      resource: { uri: string; current_organization: string };
    }>("/users/me");

    const organizationUri = userResponse.resource.current_organization;
    const userUri = userResponse.resource.uri;

    const webhookResponse = await calendlyFetch<{
      resource: {
        uri: string;
        callback_url: string;
        events: string[];
        scope: string;
        state: string;
        signing_key: string;
        creator: string;
        organization: string;
        user: string;
        created_at: string;
        updated_at: string;
        retry_started_at: string | null;
      };
    }>("/webhook_subscriptions", {
      method: "POST",
      body: JSON.stringify({
        url: webhookUrl,
        events: ["invitee.created", "invitee.canceled"],
        organization: organizationUri,
        user: userUri,
        scope: "organization",
        signing_key: generateSigningKey(),
      }),
    });

    return NextResponse.json({
      success: true,
      webhook: webhookResponse.resource,
      signingKey: webhookResponse.resource.signing_key,
      message: "Webhook criado! Copie o signing_key e adicione ao .env como CALENDLY_WEBHOOK_SECRET",
    });
  } catch (error) {
    console.error("[Calendly] Error creating webhook:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar webhook" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const webhookUri = searchParams.get("uri");

    if (!webhookUri) {
      return NextResponse.json({ error: "URI do webhook é obrigatória" }, { status: 400 });
    }

    const webhookUuid = webhookUri.split("/").pop();

    await fetch(`${CALENDLY_BASE_URL}/webhook_subscriptions/${webhookUuid}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${CALENDLY_API_KEY}`,
      },
    });

    return NextResponse.json({ success: true, message: "Webhook removido" });
  } catch (error) {
    console.error("[Calendly] Error deleting webhook:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao remover webhook" },
      { status: 500 }
    );
  }
}

function generateSigningKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
