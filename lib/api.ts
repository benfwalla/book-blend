export interface Friend {
  id: string;
  name: string;
  image_url: string;
  profile_url: string;
  book_count?: string;
}

export interface UserInfo {
  user: {
    id: string;
    name: string;
    image_url: string;
    profile_url: string;
    book_count?: string;
    username?: string;
  };
  friends: Friend[];
}

export async function getUser(userId: string, signal?: AbortSignal): Promise<UserInfo> {
  const url = new URL("/api/user", window.location.origin);
  url.searchParams.set("user_id", userId);
  const res = await fetch(url.toString(), { cache: "no-store", signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch user: ${res.status}`);
  }
  return res.json();
}

export async function getBlend(userId1: string, userId2: string, signal?: AbortSignal): Promise<any> {
  const url = new URL("/api/blend", window.location.origin);
  url.searchParams.set("user_id1", userId1);
  url.searchParams.set("user_id2", userId2);
  const res = await fetch(url.toString(), { cache: "no-store", signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch blend: ${res.status}`);
  }
  return res.json();
}
