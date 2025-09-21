import { ImageResponse } from 'next/og';
import { getUserBySlug, getCachedUser } from '@/lib/database';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const blendId = searchParams.get('blend');
    const user1Id = searchParams.get('user1');
    const user2Id = searchParams.get('user2');
        
    // Handle blend pages
    if (blendId && user1Id && user2Id) {
      const user1 = await getCachedUser(user1Id);
      const user2 = await getCachedUser(user2Id);
      
      return new ImageResponse(
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            background: '#FDDEA9',
            position: 'relative',
          }}
        >
          {/* Logo in top right */}
          <img
            src={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/img/logo-horizontal.png`}
            style={{
              position: 'absolute',
              top: '40px',
              right: '40px',
              height: '50px',
              opacity: 0.9,
            }}
            alt="BookBlend"
          />

          {/* Two profile pictures side by side */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '40px',
            marginBottom: '40px',
          }}>
            {user1?.image_url && (
              <div style={{
                display: 'flex',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '6px solid white',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              }}>
                <img
                  src={user1.image_url}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  alt={user1.name}
                />
              </div>
            )}
            
            {/* Plus sign */}
            <div style={{
              display: 'flex',
              fontSize: '60px',
              color: 'white',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}>
              +
            </div>
            
            {user2?.image_url && (
              <div style={{
                display: 'flex',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '6px solid white',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              }}>
                <img
                  src={user2.image_url}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  alt={user2.name}
                />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 20px',
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}>
            {user1?.name} + {user2?.name}
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: '28px',
            color: 'rgba(255,255,255,0.9)',
            margin: '0',
            textAlign: 'center',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}>
            Book Blend Results
          </p>
        </div>,
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Handle profile share pages
    if (slug) {
      console.log('Looking up user by slug:', slug);
      const user = await getUserBySlug(slug);
      console.log('Found user:', user ? { id: user.id, name: user.name, hasImage: !!user.image_url } : 'null');
      
      if (user && user.image_url) {
        console.log('Generating image for user with image');
        return new ImageResponse(
          <div
            style={{
              display: 'flex',
              height: '100%',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              background: '#FDDEA9',
              position: 'relative',
            }}
          >
            {/* Logo in top right */}
            <img
              src={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/img/logo-horizontal.png`}
              style={{
                position: 'absolute',
                top: '40px',
                right: '40px',
                height: '50px',
                opacity: 0.9,
              }}
              alt="BookBlend"
            />

            {/* Profile picture */}
            <div style={{
              display: 'flex',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '8px solid white',
              boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
              marginBottom: '40px',
            }}>
              <img
                src={user.image_url}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                alt={user.name}
              />
            </div>

            {/* Name */}
            <h1 style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: '0 0 20px',
              textAlign: 'center',
              fontFamily: 'Souvenir, serif',
            }}>
              {user.name}
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: '32px',
              color: '#374151',
              margin: '0',
              textAlign: 'center',
              fontFamily: 'Inter, sans-serif',
            }}>
              wants to blend books with you!
            </p>
          </div>,
          {
            width: 1200,
            height: 630,
          }
        );
      }
      
      // If user exists but no image, create a simple text-based preview
      if (user) {
        console.log('Generating simple text image for user without image');
        return new ImageResponse(
          <div
            style={{
              display: 'flex',
              height: '100%',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              background: '#FDDEA9',
              position: 'relative',
            }}
          >
            {/* Logo in top right */}
            <img
              src={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/img/logo-horizontal.png`}
              style={{
                position: 'absolute',
                top: '40px',
                right: '40px',
                height: '50px',
                opacity: 0.9,
              }}
              alt="BookBlend"
            />

            {/* Name */}
            <h1 style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: '0 0 20px',
              textAlign: 'center',
              fontFamily: 'Souvenir, serif',
            }}>
              {user.name}
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: '36px',
              color: '#374151',
              margin: '0',
              textAlign: 'center',
              fontFamily: 'Inter, sans-serif',
            }}>
              wants to blend books with you!
            </p>
          </div>,
          {
            width: 1200,
            height: 630,
          }
        );
      }
      
      console.log('No user found for slug:', slug);
    }

    // Fallback to default image
    console.log('Returning 404 - no matching conditions');
    return new Response('Not found', { status: 404 });
    
  } catch (e: any) {
    console.error(`Failed to generate image: ${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
