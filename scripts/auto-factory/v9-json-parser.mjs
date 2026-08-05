const clean = (value) => String(value ?? '').trim();
const stripCodeFence = (value) => clean(value)
  .replace(/^```(?:json)?\s*/i, '')
  .replace(/\s*```$/i, '');

const candidates = (value) => {
  const text = stripCodeFence(value).replace(/^\uFEFF/, '');
  const rows = [text];
  const firstObject = text.indexOf('{');
  const lastObject = text.lastIndexOf('}');
  if (firstObject >= 0 && lastObject > firstObject) {
    rows.push(text.slice(firstObject, lastObject + 1));
  }
  return [...new Set(rows.flatMap((row) => [
    row,
    row.replace(/,\s*([}\]])/g, '$1'),
  ]))];
};

export const parseProviderJson = (value) => {
  const errors = [];
  for (const candidate of candidates(value)) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      errors.push(String(error?.message || error));
    }
  }
  throw new Error(`AI provider did not return parseable JSON: ${errors.at(-1) || 'unknown parse error'}`);
};
