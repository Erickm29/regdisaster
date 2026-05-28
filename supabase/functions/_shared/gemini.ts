import {
  DISASTER_TYPES,
  SEVERITY_LEVELS,
  type DisasterType,
  type Severity,
} from "./constants.ts"

export interface AIClassification {
  disaster_type: DisasterType
  severity: Severity
  summary: string
}

const MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.0-flash"

export async function processIncidentWithAI(report: {
  title: string
  description?: string | null
}): Promise<AIClassification> {
  const apiKey = Deno.env.get("GEMINI_API_KEY")
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  const prompt = `You are an emergency disaster monitoring AI.
Analyze the report and respond with ONLY valid JSON (no markdown fences):
{
  "disaster_type": "<one of: ${DISASTER_TYPES.join(", ")}>",
  "severity": "<one of: ${SEVERITY_LEVELS.join(", ")}>",
  "summary": "<2-3 sentence summary for emergency operators>"
}

Title: ${report.title}
Description: ${report.description ?? "N/A"}`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    },
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini API error (${res.status}): ${errText}`)
  }

  const json = await res.json()
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text || typeof text !== "string") {
    throw new Error("Empty response from Gemini")
  }

  return parseAIResponse(text)
}

function parseAIResponse(text: string): AIClassification {
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim()
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error("Gemini returned invalid JSON")
  }

  const disaster_type = parsed.disaster_type as string
  const severity = parsed.severity as string
  const summary = parsed.summary as string

  if (!(DISASTER_TYPES as readonly string[]).includes(disaster_type)) {
    throw new Error(`Invalid disaster_type from AI: ${disaster_type}`)
  }
  if (!(SEVERITY_LEVELS as readonly string[]).includes(severity)) {
    throw new Error(`Invalid severity from AI: ${severity}`)
  }
  if (!summary || typeof summary !== "string") {
    throw new Error("Missing summary from AI")
  }

  return {
    disaster_type: disaster_type as DisasterType,
    severity: severity as Severity,
    summary: summary.trim(),
  }
}
