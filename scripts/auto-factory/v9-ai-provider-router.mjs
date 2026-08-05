import process from 'node:process';

const DEFAULT_TIMEOUT_MS = Number(process.env.V9_AI_TIMEOUT_MS || 45_000);

const clean = (value) => String(value ?? '').trim();

const timeoutSignal = (milliseconds = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`AI request timed out after ${milliseconds}ms`)), milliseconds);
  return {signal: controller.signal, clear: () => clearTimeout(timer)};
};

const stripCodeFence = (value) => clean(value)
  .replace(/^```(?:json)?\s*/i, '')
  .replace(/\s*```$/i, '');

export const extractJson = (value) => {
  const text = stripCodeFence(value);
  try {
    return JSON.parse(text);
  } catch {
    const firstObject = text.indexOf('{');
    const lastObject = text.lastIndexOf('}');
    if (firstObject >= 0 && lastObject > firstObject) {
      return JSON.parse(text.slice(firstObject, lastObject + 1));
    }
    throw new Error('AI provider did not return a JSON object.');
  }
};

const responseTextFromGemini = (payload) => {
  if (typeof payload?.output_text === 'string') return payload.output_text;
  if (typeof payload?.outputText === 'string') return payload.outputText;
  const outputs = payload?.outputs || payload?.output || [];
  const parts = [];
  const visit = (node) => {
    if (!node) return;
    if (typeof node === 'string') {
      parts.push(node);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node === 'object') {
      if (typeof node.text === 'string') parts.push(node.text);
      Object.values(node).forEach(visit);
    }
  };
  visit(outputs);
  return parts.join('\n').trim();
};

const callGemini = async ({prompt, systemInstruction}) => {
  const apiKey = clean(process.env.GEMINI_API_KEY);
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');
  const model = clean(process.env.V9_GEMINI_MODEL) || 'gemini-3.5-flash-lite';
  const {signal, clear} = timeoutSignal();
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        model,
        input: {parts: [{text: prompt}]},
        system_instruction: systemInstruction,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(`Gemini ${response.status}: ${payload?.error?.message || response.statusText}`);
    }
    return {
      provider: 'gemini',
      model,
      text: responseTextFromGemini(payload),
    };
  } finally {
    clear();
  }
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
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {role: 'system', content: systemInstruction},
            {role: 'user', content: prompt},
          ],
        }),
      },
    );
    const payload = await response.json();
    if (!response.ok || payload?.success === false) {
      throw new Error(`Cloudflare ${response.status}: ${payload?.errors?.[0]?.message || response.statusText}`);
    }
    return {
      provider: 'cloudflare',
      model,
      text: responseTextFromCloudflare(payload),
    };
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
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
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
    return {
      provider: 'pollinations',
      model,
      text: clean(payload?.choices?.[0]?.message?.content),
    };
  } finally {
    clear();
  }
};

const PROVIDERS = {
  gemini: callGemini,
  cloudflare: callCloudflare,
  pollinations: callPollinations,
};

export const providerAvailability = () => ({
  gemini: Boolean(clean(process.env.GEMINI_API_KEY)),
  cloudflare: Boolean(clean(process.env.CLOUDFLARE_ACCOUNT_ID) && clean(process.env.CLOUDFLARE_API_TOKEN)),
  pollinations: Boolean(clean(process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_KEY)),
});

export const generateStructuredJson = async ({
  prompt,
  systemInstruction,
  validate,
  provider = clean(process.env.V9_TEXT_PROVIDER) || 'auto',
}) => {
  const order = provider === 'auto'
    ? ['gemini', 'cloudflare', 'pollinations']
    : [provider];
  const attempts = [];

  for (const name of order) {
    const implementation = PROVIDERS[name];
    if (!implementation) {
      attempts.push({provider: name, ok: false, error: 'unsupported-provider'});
      continue;
    }
    try {
      const result = await implementation({prompt, systemInstruction});
      const value = extractJson(result.text);
      if (validate && !validate(value)) {
        throw new Error('Provider JSON failed V9 schema validation.');
      }
      return {
        value,
        provider: result.provider,
        model: result.model,
        attempts: [...attempts, {provider: name, ok: true}],
      };
    } catch (error) {
      attempts.push({
        provider: name,
        ok: false,
        error: clean(error?.message || error).slice(0, 240),
      });
    }
  }

  return {value: null, provider: 'deterministic', model: null, attempts};
};
