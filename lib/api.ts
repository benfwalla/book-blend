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
    slug?: string;
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
    // Try to parse error response for better error messages
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      // If we can't parse JSON, fall back to status code
      throw new Error(`Failed to fetch blend: ${res.status}`);
    }
    
    if (errorData.error && errorData.user_friendly) {
      // Throw the user-friendly error message directly
      throw new Error(errorData.error);
    } else if (errorData.error) {
      // For non-user-friendly errors, still throw them but mark as technical
      const error = new Error(errorData.error);
      (error as any).isTechnical = true;
      throw error;
    }
    
    // Fallback if no error field
    throw new Error(`Failed to fetch blend: ${res.status}`);
  }
  return res.json();
}
