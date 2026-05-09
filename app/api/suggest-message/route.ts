import { NextRequest } from "next/server";

interface LeadPayload {
  name: string;
  niche: string;
  agency: string;
  status: string;
  dealValue: string;
  daysSinceFollowUp: number;
  notes: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
  }

  let lead: LeadPayload;
  try {
    const body = await request.json();
    lead = body.lead;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const systemPrompt = `أنت مساعد مبيعات محترف متخصص في كتابة رسائل واتساب للمتابعة مع العملاء من الأطباء ورجال الأعمال.
اكتب رسائل قصيرة ودافئة ومهنية باللهجة المصرية.
الرسالة تكون طبيعية ومباشرة، مش رسمية زيادة ومش عامية زيادة.
لا تطول الرسالة عن 4-5 جمل. لا تضع عناوين أو نقاط. فقط نص الرسالة.`;

  const userContent = `اكتب رسالة واتساب لمتابعة العميل التالي:
الاسم: ${lead.name}
المجال: ${lead.niche}
الوكالة: ${lead.agency}
الحالة الحالية: ${lead.status}
قيمة الصفقة: ${lead.dealValue}
عدد الأيام من آخر متابعة: ${lead.daysSinceFollowUp} يوم
ملاحظات: ${lead.notes || "لا توجد ملاحظات"}`;

  const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
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

  if (!anthropicResponse.ok) {
    const errorText = await anthropicResponse.text();
    console.error("Anthropic API error:", errorText);
    return Response.json({ error: "Failed to generate message" }, { status: 502 });
  }

  const data = await anthropicResponse.json();
  const message: string = data.content?.[0]?.text ?? "";

  return Response.json({ message });
}
