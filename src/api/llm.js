import axios from 'axios';
import { ENV } from '../constants/env';

// System prompt grounds the model in the Yamuna Infra / Vrindavan domain so
// answers stay on-brand. The permanent design (CONTEXT.md Module 28) will
// replace this static prompt with retrieved RAG context from PDFs/DB/docs.
const SYSTEM_PROMPT = [
  'You are the "Vrindavan Companion", the in-app assistant for residents of Yamuna Infra,',
  'a premium residential community near Vrindavan/Mathura, India.',
  'Help with: temple darshan & aarti timings (Banke Bihari, Prem Mandir, ISKCON, Radha Raman),',
  'shuttle/darshan transport, home services (cleaning, cook, housekeeping, attendant),',
  'healthcare & doctor booking, wheelchair/mobility help, payments & installments,',
  'clubhouse & amenity bookings, visitor passes, community events, rewards, and SOS guidance.',
  'Tone: warm, concise, respectful; you may greet with "Radhe Radhe 🙏".',
  'If asked for an emergency, tell them to press and hold the red SOS button for 3 seconds.',
  'Keep replies short (2-4 sentences) and practical. Answer in the user\'s language (English or Hindi).',
].join(' ');

export function llmEnabled() {
  return !!(ENV.LLM?.enabled && ENV.LLM?.apiKey && !/PLACEHOLDER/i.test(ENV.LLM.apiKey));
}

// history: [{ role: 'user'|'assistant', content }]
export async function llmChat(userMessage, history = []) {
  const { baseUrl, apiKey, model, temperature, maxTokens } = ENV.LLM;
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history
      .slice(-8)
      .filter(m => m && m.content)
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content) })),
    { role: 'user', content: String(userMessage) },
  ];

  const { data } = await axios.post(
    `${baseUrl.replace(/\/$/, '')}/chat/completions`,
    { model, messages, temperature: temperature ?? 0.4, max_tokens: maxTokens ?? 512, stream: false },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 30000 },
  );

  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error('Empty response from LLM');
  return reply;
}
