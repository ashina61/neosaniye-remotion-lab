import process from 'node:process';

const DEFAULT_TIMEOUT_MS = Number(process.env.V9_AI_TIMEOUT_MS || 60_000);
const clean = (value) => String(value ?? '').trim();

const timeoutSignal = (milliseconds = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`AI request timed out after ${milliseconds}ms`)), milliseconds);
  return {signal: controller.signal, clear: () => clearTimeout(timer)};
};

const stripCodeFence = (value) => clean(value)
  .replace(/^```(?:json)?\s*/i, '')
  .replace(/\s*```$/i, '');

const normalizedJsonCandidates = (value) => {
  const raw = stripCodeFence(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const firstObject = raw.indexOf('{');
  const lastObject = raw.lastIndexOf('}');
  const sliced = firstObject >= 0 && lastObject > firstObject
    ? raw.slice(firstObject, lastObject + 1)
    : raw;
  const withoutTrailingCommas = sliced.replace(/,\s*([}\]])/g, '$1');
  return [...new Set([raw, sliced, withoutTrailingCommas])].filter(Boolean);
};

export const extractJson = (value) => {
  const failures = [];
  for (const candidate of normalizedJsonCandidates(value)) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      failures.push(clean(error?.message || error));
    }
  }
  throw new Error(`AI provider did not return valid JSON: ${failures.at(-1) || 'unknown parse error'}`);
};

const responseTextFromGemini = (payload) => {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  const parts = candidates.flatMap((candidate) => candidate?.content?.parts || []);
  const text = parts
    .map((part) => typeof part?.text === 'string' ? part.text : '')
    .filter(Boolean)
    .join('\n')
    .trim();
  if (text) return text;
  if (typeof payload?.text === 'string') return payload.text;
  throw new Error(
    payload?.promptFeedback?.blockReason
      ? `Gemini blocked the request: ${payload.promptFeedback.blockReason}`
      : 'Gemini response contained no text candidate.',
  );
};

const callGeminiModel = async ({model, prompt, systemInstruction}) => {
  const apiKey = clean(process.env.GEMINI_API_KEY);
  const {signal, clear} = timeoutSignal();
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {parts: [{text: systemInstruction}]},
          contents: [{role: 'user', parts: [{text: prompt}]}],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 32768,
            temperature: 0.35,
          },
        }),
      },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`Gemini ${model} HTTP ${response.status}: ${payload?.error?.message || response.statusText}`);
    }
    return {provider: 'gemini', model, text: responseTextFromGemini(payload)};
  } finally {
    clear();
  }
};

const callGemini = async ({prompt, systemInstruction}) => {
  const apiKey = clean(process.env.GEMINI_API_KEY);
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');
  const models = [...new Set([
    clean(process.env.V9_GEMINI_MODEL),
    'gemini-3.5-flash-lite',
    'gemini-2.5-flash-lite',
  ].filter(Boolean))];
  const failures = [];
  for (const model of models) {
    try {
      return await callGeminiModel({model, prompt, systemInstruction});
    } catch (error) {
      failures.push(`${model}: ${clean(error?.message || error)}`);
    }
  }
  throw new Error(`Gemini model attempts failed: ${failures.join(' | ')}`);
};

const responseTextFromCloudflare = (payload) => clean(
  payload?.result?.response
  ?? payload?.result?.text
  ?? payload?.response
  ?? payload?.text,
);

const callCloudflare = async ({prompt, systemInstruction}) => {
  const accountId = clean(process.env.CLOUDFLARE_ACCOUNT_ID);
  const apiToken = clean(process.env.CLOUDFLARE_API_TOKEN);
  if (!accountId || !apiToken) throw new Error('Cloudflare Workers AI credentials are not configured.');
  const model = clean(process.env.V9_CLOUDFLARE_TEXT_MODEL) || '@cf/zai-org/glm-4.7-flash';
  const {signal, clear} = timeoutSignal();
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${model}`,
      {
        method: 'POST',
        signal,
        headers: {Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json'},
        body: JSON.stringify({messages: [
          {role: 'system', content: systemInstruction},
          {role: 'user', content: prompt},
        ]}),
      },
    );
    const payload = await response.json();
    if (!response.ok || payload?.success === false) {
      throw new Error(`Cloudflare ${response.status}: ${payload?.errors?.[0]?.message || response.statusText}`);
    }
    return {provider: 'cloudflare', model, text: responseTextFromCloudflare(payload)};
  } finally {
    clear();
  }
};

const callPollinations = async ({prompt, systemInstruction}) => {
  const apiKey = clean(process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_KEY);
  if (!apiKey) throw new Error('POLLINATIONS_API_KEY is not configured.');
  const model = clean(process.env.V9_POLLINATIONS_TEXT_MODEL) || 'gemini';
  const {signal, clear} = timeoutSignal();
  try {
    const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
      method: 'POST',
      signal,
      headers: {Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        model,
        messages: [
          {role: 'system', content: systemInstruction},
          {role: 'user', content: prompt},
        ],
        response_format: {type: 'json_object'},
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(`Pollinations ${response.status}: ${payload?.error?.message || response.statusText}`);
    }
    return {provider: 'pollinations', model, text: clean(payload?.choices?.[0]?.message?.content)};
  } finally {
    clear();
  }
};

const PROVIDERS = {gemini: callGemini, cloudflare: callCloudflare, pollinations: callPollinations};

export const providerAvailability = () => ({
  gemini: Boolean(clean(process.env.GEMINI_API_KEY)),
  cloudflare: Boolean(clean(process.env.CLOUDFLARE_ACCOUNT_ID) && clean(process.env.CLOUDFLARE_API_TOKEN)),
  pollinations: Boolean(clean(process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_KEY)),
});

export const generateStructuredJson = async ({
  prompt,
  systemInstruction,
  validate,
  provider = clean(process.env.V9_TEXT_PROVIDER || process.env.V9_AI_PROVIDER) || 'auto',
}) => {
  const order = provider === 'auto' ? ['gemini', 'cloudflare', 'pollinations'] : [provider];
  const attempts = [];

  for (const name of order) {
    const implementation = PROVIDERS[name];
    if (!implementation) {
      attempts.push({provider: name, ok: false, error: 'unsupported-provider'});
      continue;
    }

    const providerPrompts = name === 'gemini'
      ? [
          {prompt, systemInstruction},
          {
            prompt: `Return the requested object as strict valid JSON. Do not use trailing commas, comments, markdown or omitted fields.\n\n${prompt}`,
            systemInstruction: `${systemInstruction} This is a JSON repair retry. Produce strict parseable JSON only.`,
          },
        ]
      : [{prompt, systemInstruction}];

    for (const [retryIndex, request] of providerPrompts.entries()) {
      try {
        const result = await implementation(request);
        const value = extractJson(result.text);
        if (validate && !validate(value)) {
          throw new Error('Provider JSON failed V9 schema validation.');
        }
        return {
          value,
          provider: result.provider,
          model: result.model,
          attempts: [...attempts, {provider: name, model: result.model, retry: retryIndex, ok: true}],
        };
      } catch (error) {
        attempts.push({
          provider: name,
          retry: retryIndex,
          ok: false,
          error: clean(error?.message || error).slice(0, 800),
        });
      }
    }
  }

  return {value: null, provider: 'deterministic', model: null, attempts};
};
