import { Metadata } from 'next';
import { getCachedUser } from '@/lib/database';

interface BlendLayoutProps {
  children: React.ReactNode;
  params: { blendId: string };
}

export async function generateMetadata({ params }: { params: { blendId: string } }): Promise<Metadata> {
  const { blendId } = params;
  
  try {
    // You'll need to implement a function to get blend data by ID
    // For now, let's use a generic blend preview
    const imageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bookblend.app'}/api/og?blend=${encodeURIComponent(blendId)}`;

    return {
      title: 'Book Blend Results - BookBlend',
      description: 'Discover your next favorite book through this personalized blend',
      openGraph: {
        title: 'Book Blend Results - BookBlend',
        description: 'Discover your next favorite book through this personalized blend',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: 'Book Blend Results',
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Book Blend Results - BookBlend',
        description: 'Discover your next favorite book through this personalized blend',
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

export default function BlendLayout({ children }: BlendLayoutProps) {
  return <>{children}</>;
}
