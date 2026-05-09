import { NextRequest } from "next/server";

const MAX_NOTES_LENGTH = 1200;

interface LeadPayload {
  name: string;
  niche: string;
  agency: string;
  status: string;
  dealValue: string;
  followUpTiming: string;
  notes: string;
}

interface AnthropicTextBlock {
  type: "text";
  text: string;
}

interface AnthropicResponse {
  content?: AnthropicTextBlock[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function truncateText(value: string) {
  return value.length > MAX_NOTES_LENGTH
    ? `${value.slice(0, MAX_NOTES_LENGTH)}...`
    : value;
}

function parseLeadPayload(value: unknown): LeadPayload | null {
  if (!isRecord(value)) return null;

  const name = cleanText(value.name);
  const status = cleanText(value.status);
  const agency = cleanText(value.agency);

  if (!name || !status || !agency) return null;

  return {
    name,
    status,
    agency,
    niche: cleanText(value.niche, "غير محدد"),
    dealValue: cleanText(value.dealValue, "غير محددة"),
    followUpTiming: cleanText(value.followUpTiming, "غير محدد"),
    notes: truncateText(cleanText(value.notes, "لا توجد ملاحظات")),
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const lead = parseLeadPayload(isRecord(body) ? body.lead : null);
  if (!lead) {
    return Response.json({ error: "Missing required lead details" }, { status: 400 });
  }

  const systemPrompt = `أنت مساعد مبيعات محترف متخصص في كتابة رسائل واتساب للمتابعة مع العملاء من الأطباء ورجال الأعمال.
اكتب رسالة قصيرة ودافئة ومهنية باللهجة المصرية.
الرسالة تكون طبيعية ومباشرة، مش رسمية زيادة ومش عامية زيادة.
لا تطول الرسالة عن 4-5 جمل. لا تضع عناوين أو نقاط. فقط نص الرسالة.`;

  const userContent = `اكتب رسالة واتساب لمتابعة العميل التالي:
الاسم: ${lead.name}
المجال: ${lead.niche}
الوكالة: ${lead.agency}
الحالة الحالية: ${lead.status}
قيمة الصفقة: ${lead.dealValue}
توقيت المتابعة: ${lead.followUpTiming}
ملاحظات: ${lead.notes}`;

  let anthropicResponse: Response;
  try {
    anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });
  } catch (error) {
    console.error("Anthropic API network error:", error);
    return Response.json({ error: "Could not reach Anthropic" }, { status: 502 });
  }

  if (!anthropicResponse.ok) {
    const errorText = await anthropicResponse.text();
    console.error("Anthropic API error:", errorText);
    return Response.json({ error: "Failed to generate message" }, { status: 502 });
  }

  let data: AnthropicResponse;
  try {
    data = (await anthropicResponse.json()) as AnthropicResponse;
  } catch {
    return Response.json({ error: "Invalid response from Anthropic" }, { status: 502 });
  }

  const message = data.content?.find((block) => block.type === "text")?.text?.trim();
  if (!message) {
    return Response.json({ error: "Anthropic returned an empty message" }, { status: 502 });
  }

  return Response.json({ message });
}
