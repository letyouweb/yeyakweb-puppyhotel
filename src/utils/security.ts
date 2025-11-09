export async function hashSecurityAnswer(answer: string) {
  const normalized = (answer || '').trim().toLowerCase();
  if (!normalized) {
    throw new Error('보안 답변이 필요합니다.');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('이 환경에서는 보안 해시를 생성할 수 없습니다.');
  }

  const hashBuffer = await subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
