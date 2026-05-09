export function koreanNgramTokenize(text: string): string[] {
  const tokens: string[] = [];
  const words = text.split(/[\s,.!?:;()[\]{}<>"'`/\\|@#$%^&*+=~\-—–]+/).filter(Boolean);
  for (const word of words) {
    if (/^[a-zA-Z0-9_]+$/.test(word)) {
      tokens.push(word.toLowerCase());
      continue;
    }
    if (word.length === 1) {
      tokens.push(word.toLowerCase());
      continue;
    }
    for (let i = 0; i < word.length - 1; i++) {
      tokens.push(word.slice(i, i + 2).toLowerCase());
    }
  }
  return tokens;
}
