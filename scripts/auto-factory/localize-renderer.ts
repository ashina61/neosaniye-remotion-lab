import {readFile, writeFile} from 'node:fs/promises';

const rendererPath = 'src/auto-factory/AutoShortV3.tsx';
let source = await readFile(rendererPath, 'utf8');

const replacements: Array<[string, string]> = [
  [
    '>ÖNCE</text>',
    ">{plan.language === 'en' ? 'BEFORE' : 'ÖNCE'}</text>",
  ],
  [
    '>SONRA</text>',
    ">{plan.language === 'en' ? 'AFTER' : 'SONRA'}</text>",
  ],
  [
    ".toLocaleUpperCase('tr-TR')",
    ".toLocaleUpperCase(plan.language === 'en' ? 'en-US' : 'tr-TR')",
  ],
];

let changes = 0;
for (const [from, to] of replacements) {
  if (!source.includes(from)) continue;
  source = source.split(from).join(to);
  changes += 1;
}

await writeFile(rendererPath, source, 'utf8');
console.log(`V3 renderer localization ready: ${changes} replacement groups applied.`);
