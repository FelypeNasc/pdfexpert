const KEY_PREFIX = 'pdfexpert_chat_';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function saveMessages(collectionName: string, messages: Message[]): void {
  try {
    localStorage.setItem(KEY_PREFIX + collectionName, JSON.stringify(messages));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      throw e; // Let caller handle quota errors
    }
  }
}

export function loadMessages(collectionName: string): Message[] {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + collectionName);
    if (!raw) return [];
    return JSON.parse(raw) as Message[];
  } catch {
    return [];
  }
}

export function deleteMessages(collectionName: string): void {
  try {
    localStorage.removeItem(KEY_PREFIX + collectionName);
  } catch {
    // ignore
  }
}
