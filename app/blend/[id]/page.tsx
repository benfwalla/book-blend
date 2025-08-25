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
  blend: {
    score: number;
    note?: string;
    preliminary?: boolean;
  };
  users: {
    [key: string]: {
      id: string;
      name: string;
      image_url?: string;
      metrics?: {
        read_count?: number;
        avg_rating?: number;
        pages_read?: number;
        total_book_count?: number;
        dominant_era?: string;
        oldest_book_details?: {
          title: string;
          author: string;
          year: number;
          image?: string;
        };
        longest_book_details?: {
          title: string;
          author: string;
          pages: number;
          image?: string;
        };
      };
    };
  };
  ai_insights?: {
    users: {
      user1: string;
      user2: string;
    };
    reading_style?: {
      user1_summary: string;
      user2_summary: string;
      compatibility_score: number;
      compatibility_details: string;
    };
    genre_insights?: {
      shared_genres: string[];
      recommendations: string[];
    };
    book_recommendations?: {
      for_both: string[];
      for_user1: string[];
      for_user2: string[];
    };
  };
  common_books?: Array<{
    title: string;
    author: string;
    image?: string;
    user1_shelves: string;
    user2_shelves: string;
    book_id: string;
    link: string;
    average_rating: number;
    publication_year: number;
  }>;
  common_authors?: Array<{
    author: string;
    user1_books: Array<{ title: string; }>;
    user2_books: Array<{ title: string; }>;
  }>;
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

  const [copied, setCopied] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Animate score counter on load
  useEffect(() => {
    if (!blendData?.blend?.score) return;
    
    const targetScore = blendData.blend.score;
    const startScore = Math.max(0, targetScore - 20); // Start 20 points below target
    const duration = 900;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentScore = startScore + (targetScore - startScore) * easeOut;
      
      setAnimatedScore(currentScore);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    // Set initial score and start animation
    setAnimatedScore(startScore);
    requestAnimationFrame(animate);
  }, [blendData?.blend?.score]);

  // Helper functions for data processing
  const getUserNames = () => {
    if (!blendData?.users) return { user1Name: "User 1", user2Name: "User 2" };
    
    const userIds = Object.keys(blendData.users);
    const user1Name = blendData.users[userIds[0]]?.name || "User 1";
    const user2Name = blendData.users[userIds[1]]?.name || "User 2";
    
    return { user1Name, user2Name };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-indigo-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return "Incredible match! You two have amazing reading compatibility.";
    if (score >= 60) return "Great compatibility! You share many reading interests.";
    if (score >= 40) return "Good potential! Some shared interests with room to explore.";
    return "Different tastes, but that's what makes recommendations exciting!";
  };

  const formatReadingStats = (user: any) => {
    if (!user?.metrics) return "Limited reading data available";
    
    const { read_count, pages_read, avg_rating, total_book_count } = user.metrics;
    
    const parts = [];
    if (read_count) parts.push(`${read_count} books read`);
    if (pages_read) parts.push(`${pages_read.toLocaleString()} pages`);
    if (avg_rating) parts.push(`${avg_rating.toFixed(1)} avg rating`);
    
    return parts.length > 0 ? parts.join(" • ") : "Limited reading data available";
  };

  const getBookImages = () => {
    const images: string[] = [];
    
    // Get images from common books
    if (blendData?.common_books) {
      blendData.common_books.slice(0, 6).forEach(book => {
        if (book.image && !book.image.includes('nophoto')) {
          images.push(book.image);
        }
      });
    }
    
    // Get images from user's notable books
    if (blendData?.users) {
      Object.values(blendData.users).forEach(user => {
        if (user.metrics?.oldest_book_details?.image && !user.metrics.oldest_book_details.image.includes('nophoto')) {
          images.push(user.metrics.oldest_book_details.image);
        }
        if (user.metrics?.longest_book_details?.image && !user.metrics.longest_book_details.image.includes('nophoto')) {
          images.push(user.metrics.longest_book_details.image);
        }
      });
    }
    
    return [...new Set(images)].slice(0, 8); // Remove duplicates and limit to 8
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

  const { user1Name, user2Name } = getUserNames();
  const score = blendData.blend?.score || 0;
  const isLimitedData = blendData.blend?.note?.includes("Limited data") || blendData.blend?.preliminary;
  const createdDate = new Date(blendData._meta.created_at).toLocaleDateString();
  const bookImages = getBookImages();

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section - Clean */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* User Avatars */}
          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="text-center">
              <div 
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => window.open(`https://www.goodreads.com/user/show/${Object.keys(blendData.users)[0]}`, '_blank')}
              >
                <img 
                  src={blendData.users?.[Object.keys(blendData.users)[0]]?.image_url} 
                  alt={user1Name}
                  className="w-20 h-20 rounded-full border-4 shadow-md object-cover"
                  style={{borderColor: '#DBD5C1'}}
                />
              </div>
              <p className="mt-2 font-medium text-gray-900">{user1Name}</p>
            </div>
            
            <div className="text-4xl text-gray-400 font-light">×</div>
            
            <div className="text-center">
              <div 
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => window.open(`https://www.goodreads.com/user/show/${Object.keys(blendData.users)[1]}`, '_blank')}
              >
                <img 
                  src={blendData.users?.[Object.keys(blendData.users)[1]]?.image_url} 
                  alt={user2Name}
                  className="w-20 h-20 rounded-full border-4 shadow-md object-cover"
                  style={{borderColor: '#DBD5C1'}}
                />
              </div>
              <p className="mt-2 font-medium text-gray-900">{user2Name}</p>
            </div>
          </div>

          {/* Score Display */}
          <div className="text-center">
            <div className={`text-8xl font-bold font-souvenir ${getScoreColor(score)} mb-4`}>
              {animatedScore.toFixed(1)}%
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Reading Compatibility</h1>
            <p className="text-lg text-gray-600 mb-6">
              {getScoreDescription(score)}
            </p>
            
            {isLimitedData && (
              <p className="text-sm text-gray-500 mb-6 bg-gray-50 rounded-full px-4 py-2 inline-block">
                Based on limited data • Score may improve with more reading history
              </p>
            )}
          </div>

          {/* Share Button - Prominent */}
          <div className="border border-gray-200 rounded-lg p-3 max-w-lg mx-auto bg-white">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Share this blend</p>
                <p className="text-sm font-mono text-gray-700 truncate">{window.location.href}</p>
              </div>
              <button
                onClick={copyLink}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors duration-200 ${
                  copied 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {copied ? (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  'Copy Link'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Reading Profiles */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Reading Profiles</h2>
            
            <div className="space-y-4">
              {blendData.users && Object.values(blendData.users).map((user, index) => (
                <div key={user.id} className="bg-white rounded-lg p-6 shadow-md border">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={user.image_url} alt={user.name} className="w-12 h-12 rounded-full border-2 object-cover" style={{borderColor: '#DBD5C1'}} />
                    <div>
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <p className="text-gray-600 text-sm">{formatReadingStats(user)}</p>
                    </div>
                  </div>
                  
                  {user.metrics && (
                    <div className="space-y-3 text-sm">
                      {user.metrics.dominant_era && (
                        <p><span className="font-medium">Favorite Era:</span> {user.metrics.dominant_era.replace(/_/g, ' ').replace('present', 'Present')}</p>
                      )}
                      
                      {user.metrics.oldest_book_details && (
                        <div className="flex items-center gap-3">
                          <span className="font-medium">Oldest Book:</span>
                          {user.metrics.oldest_book_details.image && !user.metrics.oldest_book_details.image.includes('nophoto') && (
                            <img 
                              src={user.metrics.oldest_book_details.image} 
                              alt={user.metrics.oldest_book_details.title}
                              className="w-8 h-10 object-contain rounded-sm shadow"
                            />
                          )}
                          <span>"{user.metrics.oldest_book_details.title}" ({user.metrics.oldest_book_details.year})</span>
                        </div>
                      )}
                      
                      {user.metrics.longest_book_details && (
                        <div className="flex items-center gap-3">
                          <span className="font-medium">Longest Book:</span>
                          {user.metrics.longest_book_details.image && !user.metrics.longest_book_details.image.includes('nophoto') && (
                            <img 
                              src={user.metrics.longest_book_details.image} 
                              alt={user.metrics.longest_book_details.title}
                              className="w-8 h-10 object-contain rounded-sm shadow"
                            />
                          )}
                          <span>"{user.metrics.longest_book_details.title}" ({user.metrics.longest_book_details.pages} pages)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Insights & Recommendations */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Reading Connection</h2>
            
            {/* Compatibility Insights */}
            {blendData.ai_insights?.reading_style && (
              <div className="bg-white rounded-lg p-6 shadow-md border">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Reading Compatibility</h1>
                <p className="text-lg text-gray-600 mb-6">
                  {getScoreDescription(score)}
                </p>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h4 className="font-medium text-indigo-600">{user1Name}'s Style</h4>
                    <p className="text-sm text-gray-600">{blendData.ai_insights.reading_style.user1_summary}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-purple-600">{user2Name}'s Style</h4>
                    <p className="text-sm text-gray-600">{blendData.ai_insights.reading_style.user2_summary}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Shared Interests */}
            {blendData.ai_insights?.genre_insights && (
              <div className="bg-white rounded-lg p-6 shadow-md border">
                <h3 className="font-semibold text-lg mb-4">What You Both Love</h3>
                
                {blendData.ai_insights.genre_insights.shared_genres.length > 0 ? (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Shared Genres</h4>
                    <div className="flex flex-wrap gap-2">
                      {blendData.ai_insights.genre_insights.shared_genres.map((genre, index) => (
                        <span key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 mb-4">
                    {user1Name} and {user2Name} have different genre preferences, which makes for exciting discovery opportunities!
                  </p>
                )}
                
                {blendData.ai_insights.genre_insights.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Exploration Ideas</h4>
                    <ul className="space-y-1">
                      {blendData.ai_insights.genre_insights.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-700">• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Book Recommendations */}
            {blendData.ai_insights?.book_recommendations && (
              <div className="bg-white rounded-lg p-6 shadow-md border">
                <h3 className="font-semibold text-lg mb-4">Recommended Reads</h3>
                
                {blendData.ai_insights.book_recommendations.for_both.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-green-600 mb-2">Perfect for Both of You</h4>
                    <ul className="space-y-1">
                      {blendData.ai_insights.book_recommendations.for_both.map((book, index) => (
                        <li key={index} className="text-sm text-gray-700">📚 {book}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-4">
                  {blendData.ai_insights.book_recommendations.for_user1.length > 0 && (
                    <div>
                      <h4 className="font-medium text-indigo-600 mb-2">For {user1Name}</h4>
                      <ul className="space-y-1">
                        {blendData.ai_insights.book_recommendations.for_user1.map((book, index) => (
                          <li key={index} className="text-sm text-gray-700">• {book}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {blendData.ai_insights.book_recommendations.for_user2.length > 0 && (
                    <div>
                      <h4 className="font-medium text-purple-600 mb-2">For {user2Name}</h4>
                      <ul className="space-y-1">
                        {blendData.ai_insights.book_recommendations.for_user2.map((book, index) => (
                          <li key={index} className="text-sm text-gray-700">• {book}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Books You Both Know - Enhanced with Read Status */}
        {blendData.common_books && blendData.common_books.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Books You Both Know</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {blendData.common_books
                .sort((a, b) => {
                  const aUser1Read = (a.user1_shelves || 'unknown') === 'read';
                  const aUser2Read = (a.user2_shelves || 'unknown') === 'read';
                  const bUser1Read = (b.user1_shelves || 'unknown') === 'read';
                  const bUser2Read = (b.user2_shelves || 'unknown') === 'read';
                  
                  // Priority: both read (3), one read (2), neither read (1)
                  const aPriority = (aUser1Read && aUser2Read) ? 3 : (aUser1Read || aUser2Read) ? 2 : 1;
                  const bPriority = (bUser1Read && bUser2Read) ? 3 : (bUser1Read || bUser2Read) ? 2 : 1;
                  
                  return bPriority - aPriority; // Sort descending (highest priority first)
                })
                .map((book, index) => {
                const user1Shelf = book.user1_shelves || 'unknown';
                const user2Shelf = book.user2_shelves || 'unknown';
                const user1Read = user1Shelf === 'read';
                const user2Read = user2Shelf === 'read';

                const handleBookClick = () => {
                  if (book.book_id) {
                    window.open(`https://www.goodreads.com/book/show/${book.book_id}`, '_blank');
                  }
                };

                return (
                  <div 
                    key={index} 
                    className="bg-white rounded-lg p-3 shadow-md border hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    onClick={handleBookClick}
                  >
                    <div className="relative overflow-hidden">
                      {book.image && !book.image.includes('nophoto') ? (
                        <img 
                          src={book.image} 
                          alt={book.title}
                          className="w-full h-32 object-contain rounded-sm mb-2 group-hover:opacity-15 transition-opacity duration-200"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center mb-2 group-hover:opacity-15 transition-opacity duration-200">
                          <span className="text-gray-400 text-xs">📚</span>
                        </div>
                      )}
                      
                      {/* Hover overlay with title and author */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <div className="text-center px-1 max-w-full">
                          <h4 className="font-medium text-xs text-gray-900 mb-1 line-clamp-3 break-words">{book.title}</h4>
                          <p className="text-xs text-gray-600 line-clamp-1 break-words">{book.author}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Profile Picture Status Indicators */}
                    <div className="flex justify-center items-center gap-1">
                      <div className="relative">
                        <img 
                          src={blendData.users?.[Object.keys(blendData.users)[0]]?.image_url} 
                          alt={user1Name}
                          className={`w-6 h-6 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform ${user1Read ? 'border-green-500' : 'opacity-50'}`}
                          style={!user1Read ? {borderColor: '#DBD5C1'} : {}}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://www.goodreads.com/user/show/${Object.keys(blendData.users)[0]}`, '_blank');
                          }}
                        />
                        {user1Read && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center pointer-events-none">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <img 
                          src={blendData.users?.[Object.keys(blendData.users)[1]]?.image_url} 
                          alt={user2Name}
                          className={`w-6 h-6 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform ${user2Read ? 'border-green-500' : 'opacity-50'}`}
                          style={!user2Read ? {borderColor: '#DBD5C1'} : {}}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://www.goodreads.com/user/show/${Object.keys(blendData.users)[1]}`, '_blank');
                          }}
                        />
                        {user2Read && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center pointer-events-none">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={copyLink}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 h-auto"
          >
            📤 Share This Blend
          </Button>
          <Button 
            onClick={handleReBlend} 
            disabled={loading}
            variant="secondary"
            className="px-8 py-3 h-auto"
          >
            🔄 Re-Blend
          </Button>
        </div>

        {/* Metadata */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Blended on {createdDate}
        </div>
      </div>
    </main>
  );
}
