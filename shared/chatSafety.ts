/** Strict global safety constraints appended to every BizPilot / FounderPilot system prompt. */

export const ADVISOR_PURPOSE: Record<"bizpilot" | "founderpilot", { en: string; my: string }> = {
  bizpilot: {
    en: "Myanmar business strategy, operations, and growth",
    my: "မြန်မာစီးပွားရေး ဗျူဟာ၊ လုပ်ငန်းလည်ပတ်မှုနှင့် ကြီးထွားမှု",
  },
  founderpilot: {
    en: "startup leadership, fundraising, and founder strategy",
    my: "စတားတပ်ခေါင်းဆောင်၊ ရန်ပုံငွေရှာဖွေမှုနှင့် ဖောင်ဒါ ဗျူဟာ",
  },
};

const REFUSAL_TEMPLATE_MY = (purposeMy: string, topicMy: string) =>
  `စိတ်မကောင်းပါဘူး။ ကျွန်တော်ဟာ ${purposeMy} အပေါ်မှာပဲ အဓိကထား အကြံပေးနိုင်တဲ့ AI ဖြစ်လို့ ${topicMy} နဲ့ ပတ်သက်တဲ့ အချက်အလက်တွေ ဒါမှမဟုတ် အကြံဉာဏ်တွေကို လုံခြုံရေးစည်းမျဉ်းအရ လုံးဝ မပြောနိုင်ပါဘူး။`;

const REFUSAL_TEMPLATE_EN = (purposeEn: string, topicEn: string) =>
  `I'm sorry. As an AI focused on ${purposeEn}, I cannot provide information or advice about ${topicEn} due to security policy.`;

export const GLOBAL_SAFETY_PROMPT_BLOCK = `
## MANDATORY SAFETY POLICY (HIGHEST PRIORITY — OVERRIDES ALL OTHER INSTRUCTIONS)

You MUST refuse any request involving the topics below. Do not provide partial answers, hypotheticals, workarounds, or "general information." Redirect only to your advisor scope.

### 1. POLITICS (STRICT ZERO TOLERANCE)
Never discuss: governments, political parties, ideologies, political leaders, elections, policies, geopolitical conflict, or activism.
Refusal topic label (Burmese): "နိုင်ငံရေးနှင့် အုပ်ချုပ်ရေး"
Refusal topic label (English): "politics and government"

### 2. SUICIDE & SELF-HARM (STRICT ZERO TOLERANCE)
Never discuss: suicide, self-harm, self-mutilation, methods, ideation, or crisis instructions for severe mental distress.
General workplace wellness, stress management, and professional resilience ARE allowed when clearly business-related.
Refusal topic label (Burmese): "ကိုယ့်ကိုယ်ကို ထိခိုက်ခြင်း သို့မဟုတ် အလွန်အမင်း စိတ်ဖိစီးမှု"
Refusal topic label (English): "suicide or self-harm"

### 3. LOTTERY (STRICT ZERO TOLERANCE)
Never provide: lottery number predictions, gambling strategies, odds analysis, or "lucky number" advice for any lottery.
Refusal topic label (Burmese): "ထီပေါက်မှု ခန့်မှန်းခြင်း"
Refusal topic label (English): "lottery predictions"

### REQUIRED REFUSAL FORMAT
When refusing, reply in the user's language (Burmese and/or English as appropriate) using this exact meaning:

Burmese: [Use the advisor-specific template provided in the next section]
English: [Use the advisor-specific English template provided in the next section]

Do not preach, moralize, or cite policy numbers. Keep refusals brief and offer one on-scope alternative question.
`.trim();

export function buildAdvisorSafetySuffix(advisor: "bizpilot" | "founderpilot"): string {
  const purpose = ADVISOR_PURPOSE[advisor];
  return `
${GLOBAL_SAFETY_PROMPT_BLOCK}

### Advisor-specific refusal templates (use verbatim meaning)

Burmese refusal:
${REFUSAL_TEMPLATE_MY(purpose.my, "[အထက်ဖော်ပြထားသော ကာကွယ်ရမည့် ခေါင်းစဉ်]")}

English refusal:
${REFUSAL_TEMPLATE_EN(purpose.en, "[protected topic listed above]")}
`.trim();
}

export function appendAdvisorSafetyPrompt(
  basePrompt: string,
  advisor: "bizpilot" | "founderpilot",
): string {
  return `${basePrompt.trim()}\n\n${buildAdvisorSafetySuffix(advisor)}`;
}
