import { execFileSync } from 'node:child_process';

// Scan reachable Git blobs, including older revisions; never print matching values.
const git = args => execFileSync('git', args, { maxBuffer: 128 * 1024 * 1024 });
const objects = git(['rev-list', '--objects', '--all']).toString().trim().split('\n');
const paths = new Map(objects.map(line => [line.split(' ')[0], line.slice(41)]));
const headers = execFileSync('git', ['cat-file', '--batch-check'], { input: [...paths.keys()].join('\n') + '\n', maxBuffer: 128 * 1024 * 1024 }).toString().trim().split('\n');
const blobs = headers.filter(line => line.split(' ')[1] === 'blob').map(line => line.split(' ')[0]);
const content = execFileSync('git', ['cat-file', '--batch'], { input: blobs.join('\n') + '\n', maxBuffer: 128 * 1024 * 1024 });
const patterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['GitHub token', /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})/],
  ['cloud access key', /(?:AKIA|ASIA)[A-Z0-9]{16}/],
  ['OpenAI key', /sk-(?:proj-)?[A-Za-z0-9_-]{35,}/],
  ['embedded credential', /https:\/\/[^\s/@:]+:[^\s/@]+@/],
  ['personal email', /[A-Za-z0-9._%+-]+@(?:gmail|outlook|hotmail|yahoo)\.[A-Za-z]{2,}/i],
  ['literal secret', /(?:api[_-]?key|client[_-]?secret|password|refresh[_-]?token|access[_-]?token)\s*[:=]\s*["'][A-Za-z0-9_+\/-]{24,}["']/i],
];
const findings = [], noticesWithAuthorContacts = [];
let offset = 0;
for (const id of blobs) {
  const end = content.indexOf(10, offset);
  const size = Number(content.subarray(offset, end).toString().split(' ')[2]);
  const bytes = content.subarray(end + 1, end + 1 + size);
  offset = end + 1 + size + 1;
  if (bytes.includes(0)) continue;
  const text = bytes.toString('utf8');
  for (const [kind, expression] of patterns) if (expression.test(text)) {
    const finding = { kind, path: paths.get(id), object: id.slice(0, 10) };
    // Third-party copyright notices intentionally retain their authors' contacts.
    if (kind === 'personal email' && /^(?:src\/renderer\/legal|website\/src)\/licenses\//.test(finding.path)) noticesWithAuthorContacts.push(finding.path);
    else findings.push(finding);
  }
}
console.log(JSON.stringify({ reachableBlobs: blobs.length, findings, noticesWithAuthorContacts }, null, 2));
if (findings.length) process.exitCode = 1;
