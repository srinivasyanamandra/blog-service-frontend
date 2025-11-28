const fs = require('fs');
const path = 'src/pages/Dashboard.tsx';
const s = fs.readFileSync(path, 'utf8');
// start scanning from the return in the component to avoid parsing TypeScript generic tags before JSX
const returnIndex = s.indexOf('return (');
const startIndex = returnIndex !== -1 ? returnIndex : 0;
const tags = [];
let i = 0;
let inString = null;
while (i < s.length) {
  const ch = s[i];
  if (inString) {
    if (ch === inString) inString = null;
    else if (ch === '\\') i++;
    i++;
    continue;
  }
  if (ch === '"' || ch === "'" || ch === '`') {
    inString = ch;
    i++;
    continue;
  }
  if (i >= startIndex && ch === '<' && s[i+1] && /[A-Za-z\//]/.test(s[i+1])) {
    const isClose = s[i+1] === '/';
    let j = i+1;
    if (isClose) j++;
    let name = '';
    while (j < s.length && /[\w-:]/.test(s[j])) { name += s[j]; j++; }
    // look ahead for '/>' or '>'
    const rest = s.substring(j, j+100);
    const idxGT = rest.indexOf('>');
    const idxSelf = rest.indexOf('/>');
    const selfClose = idxSelf !== -1 && (idxGT === -1 || idxSelf < idxGT);
    if (isClose) {
      const top = tags.pop();
      if (!top) { console.log('extra close', name, 'at', i); console.log('stack at error', tags); break; }
      if (top !== name) { console.log('mismatch tag', name, 'expected', top, 'at', i); console.log('stack at mismatch', tags); break; }
    } else if (!selfClose) {
      tags.push(name);
    }
  }
  i++;
}
if (tags.length) console.log('unclosed tags at end:', tags.slice(-10)); else console.log('no unclosed tags');
