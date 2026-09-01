import { seedPosts, type CommunityPost, type ReactionKey } from '@/lib/community-data';

const databaseName = 'emotion-center-private-v1';
const postsStore = 'posts';
const settingsStore = 'settings';

type SettingRecord = { key: string; value: unknown };

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(postsStore)) database.createObjectStore(postsStore, { keyPath: 'id' });
      if (!database.objectStoreNames.contains(settingsStore)) database.createObjectStore(settingsStore, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadLocalPosts() {
  const database = await openDatabase();
  try {
    return await requestResult(database.transaction(postsStore).objectStore(postsStore).getAll()) as CommunityPost[];
  } finally {
    database.close();
  }
}

export async function saveLocalPost(post: CommunityPost) {
  const database = await openDatabase();
  try {
    await requestResult(database.transaction(postsStore, 'readwrite').objectStore(postsStore).put(post));
  } finally {
    database.close();
  }
}

export async function saveLocalPosts(posts: CommunityPost[]) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(postsStore, 'readwrite');
    for (const post of posts) transaction.objectStore(postsStore).put(post);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

export async function deleteLocalPost(id: string) {
  const database = await openDatabase();
  try {
    await requestResult(database.transaction(postsStore, 'readwrite').objectStore(postsStore).delete(id));
  } finally {
    database.close();
  }
}

export async function getSetting<T>(key: string) {
  const database = await openDatabase();
  try {
    const record = await requestResult(database.transaction(settingsStore).objectStore(settingsStore).get(key)) as SettingRecord | undefined;
    return record?.value as T | undefined;
  } finally {
    database.close();
  }
}

export async function setSetting<T>(key: string, value: T) {
  const database = await openDatabase();
  try {
    await requestResult(database.transaction(settingsStore, 'readwrite').objectStore(settingsStore).put({ key, value } satisfies SettingRecord));
  } finally {
    database.close();
  }
}

export async function deleteSetting(key: string) {
  const database = await openDatabase();
  try {
    await requestResult(database.transaction(settingsStore, 'readwrite').objectStore(settingsStore).delete(key));
  } finally {
    database.close();
  }
}

export type LocalCommunitySettings = {
  myReactions: Record<string, ReactionKey[]>;
  hiddenPostIds: string[];
};

export async function migrateLegacyLocalStorage() {
  if (typeof window === 'undefined') return;
  const alreadyMigrated = await getSetting<boolean>('legacy-migrated');
  if (alreadyMigrated) return;
  const storedPosts = window.localStorage.getItem('emotion-center-posts-v2') ?? window.localStorage.getItem('emotion-center-posts-v1');
  if (storedPosts) {
    try {
      const parsed = JSON.parse(storedPosts) as CommunityPost[];
      const seedIds = new Set(seedPosts.map((post) => post.id));
      await saveLocalPosts(parsed.map((post) => ({ ...post, isMine: post.isMine ?? !seedIds.has(post.id) })));
    } catch {
      // Invalid legacy data is ignored; no network request is made.
    }
  }
  try {
    const myReactions = JSON.parse(window.localStorage.getItem('emotion-center-reactions-v1') ?? '{}');
    const hiddenPostIds = JSON.parse(window.localStorage.getItem('emotion-center-hidden-v1') ?? '[]');
    await setSetting<LocalCommunitySettings>('community-settings', { myReactions, hiddenPostIds });
  } catch {
    await setSetting<LocalCommunitySettings>('community-settings', { myReactions: {}, hiddenPostIds: [] });
  }
  await setSetting('legacy-migrated', true);
  window.localStorage.removeItem('emotion-center-posts-v1');
  window.localStorage.removeItem('emotion-center-posts-v2');
  window.localStorage.removeItem('emotion-center-reactions-v1');
  window.localStorage.removeItem('emotion-center-hidden-v1');
}
