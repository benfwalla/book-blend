"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { JsonView } from "@/components/json-view";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { getCachedUser } from "@/lib/database";

interface BlendData {
  _meta: {
    blend_id: string;
    user1_id: string;
    user2_id: string;
    created_at: string;
  };
  [key: string]: any;
}

interface User {
  id: string;
  name: string;
  image_url: string | null;
}

export default function BlendPage() {
  const params = useParams();
  const blendId = params.id as string;
  
  const [blendData, setBlendData] = useState<BlendData | null>(null);
  const [user1, setUser1] = useState<User | null>(null);
  const [user2, setUser2] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlend() {
      try {
        setLoading(true);
        setError(null);

        // Fetch blend data
        const response = await fetch(`/api/blend/${blendId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch blend: ${response.status}`);
        }
        
        const data = await response.json();
        setBlendData(data);

        // Fetch user data for display
        if (data._meta) {
          const [user1Response, user2Response] = await Promise.all([
            fetch(`/api/user?user_id=${data._meta.user1_id}`),
            fetch(`/api/user?user_id=${data._meta.user2_id}`)
          ]);

          if (user1Response.ok) {
            const user1Data = await user1Response.json();
            setUser1({
              id: user1Data.user.id,
              name: user1Data.user.name,
              image_url: user1Data.user.image_url
            });
          }

          if (user2Response.ok) {
            const user2Data = await user2Response.json();
            setUser2({
              id: user2Data.user.id,
              name: user2Data.user.name,
              image_url: user2Data.user.image_url
            });
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load blend");
      } finally {
        setLoading(false);
      }
    }

    if (blendId) {
      fetchBlend();
    }
  }, [blendId]);

  const handleReBlend = async () => {
    if (!blendData?._meta) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/blend?user_id1=${blendData._meta.user1_id}&user_id2=${blendData._meta.user2_id}&force_new=true`);
      if (!response.ok) {
        throw new Error("Failed to create new blend");
      }
      
      const newBlend = await response.json();
      setBlendData(newBlend);
    } catch (err: any) {
      setError(err.message || "Failed to re-blend");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    // You could add a toast here
  };

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-[400px]">
        <Spinner label="Loading blend..." />
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </main>
    );
  }

  if (!blendData) {
    return (
      <main className="space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Blend Not Found</h1>
          <p className="text-gray-600">This blend doesn't exist or has been removed.</p>
        </div>
      </main>
    );
  }

  const createdDate = new Date(blendData._meta.created_at).toLocaleDateString();

  return (
    <main className="space-y-6">
      {/* Header with users */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Book Blend Result</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={copyLink}>
              Copy Link
            </Button>
            <Button onClick={handleReBlend} disabled={loading}>
              Re-Blend
            </Button>
          </div>
        </div>

        {/* User avatars and info */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {user1 && (
              <div className="flex items-center gap-2">
                <Avatar src={user1.image_url} alt={user1.name} />
                <span className="font-medium">{user1.name}</span>
              </div>
            )}
            <span className="text-gray-500">×</span>
            {user2 && (
              <div className="flex items-center gap-2">
                <Avatar src={user2.image_url} alt={user2.name} />
                <span className="font-medium">{user2.name}</span>
              </div>
            )}
          </div>
          <div className="ml-auto text-sm text-gray-500">
            Blended on {createdDate}
          </div>
        </div>
      </section>

      {/* Blend result */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Result</h2>
        <JsonView data={blendData} />
      </section>
    </main>
  );
}
