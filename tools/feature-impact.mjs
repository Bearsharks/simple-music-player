import fs from 'node:fs';
import path from 'node:path';
const names = fs.readdirSync('src/features').filter(n => fs.statSync(`src/features/${n}`).isDirectory());
const feature = process.argv[2];
if (!names.includes(feature)) {
  console.error(`Usage: npm run impact -- <${names.join('|')}>`);
  process.exit(1);
}
const imports = [];
for (const file of fs.readdirSync('src', { recursive: true }).filter(f => /\.(ts|tsx)$/.test(f))) {
  const source = `src/${file}`;
  for (const [, specifier] of fs.readFileSync(source, 'utf8').matchAll(/(?:from\s*|import\s*\(|import\s*)['"]([^'"]+)['"]/g)) {
    const target = specifier.startsWith('.') ? path.posix.normalize(path.posix.join(path.posix.dirname(source), specifier)) : /^(features|app|shared|test)\//.test(specifier) ? `src/${specifier}` : null;
    if (target) imports.push({ source, target });
  }
}
const prefix = `src/features/${feature}/`;
const incoming = imports.filter(e => !e.source.startsWith(prefix) && e.target.startsWith(prefix));
const outgoing = imports.filter(e => e.source.startsWith(prefix) && !e.target.startsWith(prefix));
console.log(`Read first: ${prefix}README.md\n\nDirect consumers (inspect if you change a contract):`);
for (const e of incoming) console.log(`  ${e.source} -> ${e.target}`);
console.log('\nDependencies used by this feature:');
for (const e of outgoing) console.log(`  ${e.source} -> ${e.target}`);
console.log('\nStatic imports only; not proof of isolation. Also inspect callback contracts, shared types, global window.player, API endpoints, routes and UI interactions listed in the README.');
