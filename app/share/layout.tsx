import { Metadata } from 'next';
import { getUserBySlug } from '@/lib/database';

interface ShareLayoutProps {
  children: React.ReactNode;
  params: { userId: string };
}

export async function generateMetadata({ params }: { params: { userId: string } }): Promise<Metadata> {
  const { userId } = params;
  
  try {
    const user = await getUserBySlug(userId);
    
    if (!user) {
      return {
        title: 'BookBlend - Find Your Next Read',
        description: 'Like Spotify Blend, but for Goodreads',
      };
    }

    const title = `${user.name}'s Book Recommendations`;
    const description = `Check out ${user.name}'s book recommendations on BookBlend`;
    const imageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bookblend.app'}/api/og?slug=${encodeURIComponent(user.slug || user.id)}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    return {
      title: 'BookBlend - Find Your Next Read',
      description: 'Like Spotify Blend, but for Goodreads',
    };
  }
}

export default function ShareLayout({ children }: ShareLayoutProps) {
  return <>{children}</>;
}
