const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// In-memory rate limiter (Supplementary Problem: Rate limiting AI requests)
const rateLimitMap = new Map();

function generateSmartFallback(title) {
  const cleanTitle = (title || 'Task').trim();
  const lower = cleanTitle.toLowerCase();

  let priority = 'Medium';
  let suggestedDeadlineDays = 3;
  let context = 'Standard task requiring development, testing, and documentation.';

  if (lower.includes('bug') || lower.includes('fix') || lower.includes('error') || lower.includes('crash')) {
    priority = 'High';
    suggestedDeadlineDays = 1;
    context = 'High-priority defect requiring immediate debugging, root-cause isolation, and regression testing.';
  } else if (lower.includes('research') || lower.includes('study') || lower.includes('learn') || lower.includes('read')) {
    priority = 'Low';
    suggestedDeadlineDays = 7;
    context = 'Exploratory task focusing on technical literature review, framework documentation, and design feasibility.';
  } else if (lower.includes('test') || lower.includes('ci') || lower.includes('pipeline') || lower.includes('deploy')) {
    priority = 'High';
    suggestedDeadlineDays = 2;
    context = 'Quality engineering task ensuring automated test coverage, linter compliance, and continuous deployment stability.';
  } else if (lower.includes('design') || lower.includes('ui') || lower.includes('frontend') || lower.includes('navbar')) {
    priority = 'Medium';
    suggestedDeadlineDays = 4;
    context = 'User interface refinement focusing on responsive mobile grid layout, accessibility, and modern aesthetics.';
  }

  const deadlineDate = new Date(Date.now() + suggestedDeadlineDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    description: `Complete the requirements for "${cleanTitle}". ${context}`,
    priority,
    suggestedDeadline: deadlineDate,
    fallback: true,
    source: 'heuristic-ai-engine',
  };
}

router.post('/generate-description', async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Task title is required to generate description' });
  }

  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'client';
  const now = Date.now();
  const lastRequestTime = rateLimitMap.get(clientIp);

  // Supplementary Problem: Rate limiting (cooldown between rapid requests)
  if (lastRequestTime && (now - lastRequestTime < 4000)) {
    const waitSeconds = Math.ceil((4000 - (now - lastRequestTime)) / 1000);
    return res.status(429).json({
      error: `Rate limit: Please wait ${waitSeconds}s before generating another AI suggestion.`,
      rateLimited: true,
    });
  }
  rateLimitMap.set(clientIp, now);

  const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

  // Graceful degradation when API key is unconfigured or placeholder
  if (!apiKey || apiKey === 'your_key_here' || apiKey.length < 10) {
    const fallback = generateSmartFallback(title);
    return res.status(200).json({
      ...fallback,
      disclaimer: '💡 Suggestion is AI-generated (graceful offline fallback). Review and modify before saving.',
      status: 'fallback',
    });
  }

  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI task assistant for student Diya Shah (D25IT118). Output ONLY a valid JSON object with keys: "description" (concise, 1-2 sentence actionable description), "priority" ("Low", "Medium", or "High"), and "turnaroundDays" (number).'
        },
        {
          role: 'user',
          content: `Write a short task description and suggest a priority level for: "${title.trim()}".`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 150,
      temperature: 0.7,
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    const days = typeof parsed.turnaroundDays === 'number' ? parsed.turnaroundDays : 3;
    const deadlineDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return res.status(200).json({
      description: parsed.description || `Execute tasks related to ${title.trim()}`,
      priority: parsed.priority || 'Medium',
      suggestedDeadline: deadlineDate,
      fallback: false,
      disclaimer: '💡 Suggestion is AI-generated (gpt-4o-mini). Review and modify before saving.',
      status: 'success',
    });
  } catch (err) {
    console.warn(`[AI Service Graceful Degradation] ${err.message}`);
    const fallback = generateSmartFallback(title);
    return res.status(200).json({
      ...fallback,
      disclaimer: '💡 Suggestion is AI-generated (graceful degradation fallback). Review and modify before saving.',
      errorEncountered: err.message,
      status: 'fallback',
    });
  }
});

module.exports = router;
