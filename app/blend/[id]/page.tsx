"use client";

import { ArrowSquareOut, Link, Check, BookOpen, Clock, Calendar, TrendUp, Star, Info } from "phosphor-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { useParams } from "next/navigation";
import { JsonView } from "../../../components/json-view";
import { Button } from "../../../components/ui/button";
import { Spinner } from "../../../components/ui/spinner";
import { Avatar } from "../../../components/ui/avatar";
import { useEffect, useState } from "react";
import { getCachedUser } from "../../../lib/database";

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
      user1_preferences?: string[];
      user2_preferences?: string[];
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
    if (!blendData?.users) return { user1Name: "User 1", user2Name: "User 2", user1Id: undefined, user2Id: undefined };
    
    // Get user names from ai_insights if available, otherwise fallback to Object.keys() order
    let user1Name = "User 1";
    let user2Name = "User 2";
    let user1Id: string | undefined;
    let user2Id: string | undefined;
    
    if (blendData.ai_insights?.users) {
      // Use ai_insights to determine who is user1 and user2
      user1Name = blendData.ai_insights.users.user1 || "User 1";
      user2Name = blendData.ai_insights.users.user2 || "User 2";
      
      // Find the corresponding user IDs by matching names
      for (const [userId, user] of Object.entries(blendData.users)) {
        if (user.name === user1Name) {
          user1Id = userId;
        } else if (user.name === user2Name) {
          user2Id = userId;
        }
      }
    } else {
      // Fallback to Object.keys() order
      const userIds = Object.keys(blendData.users);
      user1Id = userIds[0];
      user2Id = userIds[1];
      user1Name = user1Id ? blendData.users[user1Id]?.name || "User 1" : "User 1";
      user2Name = user2Id ? blendData.users[user2Id]?.name || "User 2" : "User 2";
    }
    
    return { user1Name, user2Name, user1Id, user2Id };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-indigo-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const formatEra = (era: string) => {
    switch (era) {
      case 'pre_1900': return 'Pre-1900';
      case '1900_1950': return '1900-1950';
      case '1950_1980': return '1950-1980';
      case '1980_2000': return '1980-2000';
      case '2000_2010': return '2000-2010';
      case '2010_present': return '2010 to Present';
      default: return era.replace(/_/g, ' ').replace('present', 'Present');
    }
  };

  const getDominantEraWithPercentage = (user: any) => {
    if (!user?.metrics?.dominant_era || !user?.metrics?.era_distribution) {
      return 'No data';
    }
    
    const era = user.metrics.dominant_era;
    const percentage = user.metrics.era_distribution[era];
    const formattedEra = formatEra(era);
    
    return `${formattedEra} (${percentage}%)`;
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

  const { user1Name, user2Name, user1Id, user2Id } = getUserNames();
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
                onClick={() => user1Id && window.open(`https://www.goodreads.com/user/show/${user1Id}`, '_blank')}
              >
                <img 
                  src={user1Id ? blendData.users?.[user1Id]?.image_url : undefined} 
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
                onClick={() => user2Id && window.open(`https://www.goodreads.com/user/show/${user2Id}`, '_blank')}
              >
                <img 
                  src={user2Id ? blendData.users?.[user2Id]?.image_url : undefined} 
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
                <p className="text-sm text-gray-700 truncate">{window.location.href}</p>
              </div>
              <button
                onClick={copyLink}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors duration-200 ${
                  copied 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-blend text-blend-foreground border-blend hover:bg-blend/90'
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
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        
        {/* Reading Profiles */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Reading Profiles</h2>
          
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">

            {/* Table Rows */}
            <div className="divide-y">
              {/* User Headers */}
              <div className="grid grid-cols-[0.8fr_2fr_2fr]">
                <div className="p-3 sm:p-4"></div>
                {blendData.users && user1Id && user2Id && [user1Id, user2Id].map((userId) => {
                  const user = blendData.users[userId];
                  if (!user) return null;
                  return (
                    <div key={user.id} className="p-3 sm:p-4 text-center">
                      <div className="flex flex-col items-center gap-2 sm:gap-3">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-4 shadow-md" style={{borderColor: '#DBD5C1'}}>
                          <img 
                            src={user.image_url} 
                            alt={user.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm sm:text-xl text-gray-900">{user.name}</h3>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Books Read */}
              <div className="grid grid-cols-[0.8fr_2fr_2fr]">
                <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 bg-gray-50/30">
                  <BookOpen size={14} className="text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-gray-700 text-xs sm:text-sm">Books Read</span>
                </div>
                {blendData.users && user1Id && user2Id && [user1Id, user2Id].map((userId) => {
                  const user = blendData.users[userId];
                  return (
                    <div key={`books-${userId}`} className="p-3 sm:p-4 border-l">
                      <span className="text-xs sm:text-sm text-gray-600">
                        {user?.metrics?.read_count || 0} books
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Pages Read */}
              <div className="grid grid-cols-[0.8fr_2fr_2fr]">
                <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 bg-gray-50/30">
                  <TrendUp size={14} className="text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-gray-700 text-xs sm:text-sm">Pages Read</span>
                </div>
                {blendData.users && user1Id && user2Id && [user1Id, user2Id].map((userId) => {
                  const user = blendData.users[userId];
                  return (
                    <div key={`pages-${userId}`} className="p-3 sm:p-4 border-l">
                      <span className="text-xs sm:text-sm text-gray-600">
                        {user?.metrics?.pages_read?.toLocaleString() || 0} pages
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Average Rating */}
              <div className="grid grid-cols-[0.8fr_2fr_2fr]">
                <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 bg-gray-50/30">
                  <Star size={14} className="text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-gray-700 text-xs sm:text-sm">Avg Rating</span>
                </div>
                {blendData.users && user1Id && user2Id && [user1Id, user2Id].map((userId) => {
                  const user = blendData.users[userId];
                  return (
                    <div key={`rating-${userId}`} className="p-3 sm:p-4 border-l">
                      <span className="text-xs sm:text-sm text-gray-600">
                        {user?.metrics?.avg_rating?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Reading Style */}
              <div className="grid grid-cols-[0.8fr_2fr_2fr]">
                <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 bg-gray-50/30">
                  <BookOpen size={14} className="text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-gray-700 text-xs sm:text-sm">Reading Style</span>
                </div>
                {blendData.users && user1Id && user2Id && [user1Id, user2Id].map((userId) => {
                  const isUser1 = userId === user1Id;
                  const readingStyle = isUser1 
                    ? blendData.ai_insights?.reading_style?.user1_summary 
                    : blendData.ai_insights?.reading_style?.user2_summary;
                  return (
                    <div key={`style-${userId}`} className="p-3 sm:p-4 border-l">
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{readingStyle || 'No data available'}</p>
                    </div>
                  );
                })}
              </div>

              {/* Favorite Genres */}
              <div className="grid grid-cols-[0.8fr_2fr_2fr]">
                <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 bg-gray-50/30">
                  <Star size={14} className="text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-gray-700 text-xs sm:text-sm">Genres</span>
                </div>
                {blendData.users && user1Id && user2Id && [user1Id, user2Id].map((userId) => {
                  const isUser1 = userId === user1Id;
                  const genres = isUser1 
                    ? blendData.ai_insights?.genre_insights?.user1_preferences 
                    : blendData.ai_insights?.genre_insights?.user2_preferences;
                  return (
                    <div key={`genres-${userId}`} className="p-3 sm:p-4 border-l">
                      {genres && genres.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {genres.map((genre, index) => (
                            <span 
                              key={index} 
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                isUser1 
                                  ? 'bg-indigo-100 text-indigo-700' 
                                  : 'bg-purple-100 text-purple-700'
                              }`}
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm text-gray-400">No data</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Favorite Era */}
              <div className="grid grid-cols-[0.8fr_2fr_2fr]">
                <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 bg-gray-50/30">
                  <Calendar size={14} className="text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-gray-700 text-xs sm:text-sm">Era</span>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="ml-1">
                          <Info size={12} className="text-gray-400 hover:text-gray-600 cursor-help" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-48">
                        <p>Era with highest % of books read: Pre-1900, 1900-1950, 1950-1980, 1980-2000, 2000-2010, 2010 to Present</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {blendData.users && user1Id && user2Id && [user1Id, user2Id].map((userId) => {
                  const user = blendData.users[userId];
                  return (
                    <div key={`era-${userId}`} className="p-3 sm:p-4 border-l">
                      <span className="text-xs sm:text-sm text-gray-600">
                        {getDominantEraWithPercentage(user)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Oldest Book */}
              <div className="grid grid-cols-[0.8fr_2fr_2fr]">
                <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 bg-gray-50/30">
                  <Clock size={14} className="text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-gray-700 text-xs sm:text-sm">Oldest</span>
                </div>
                {blendData.users && user1Id && user2Id && [user1Id, user2Id].map((userId) => {
                  const user = blendData.users[userId];
                  const book = user?.metrics?.oldest_book_details;
                  return (
                    <div key={`oldest-${userId}`} className="p-3 sm:p-4 border-l">
                      {book ? (
                        <div className="flex items-start gap-3">
                          {book.image && !book.image.includes('nophoto') && (
                            <img 
                              src={book.image} 
                              alt={book.title}
                              className="w-6 h-8 sm:w-8 sm:h-10 object-contain rounded-sm shadow-sm flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm text-gray-900 leading-tight break-words">{book.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{book.year}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm text-gray-400">No data</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Longest Book */}
              <div className="grid grid-cols-[0.8fr_2fr_2fr]">
                <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 bg-gray-50/30">
                  <TrendUp size={14} className="text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-gray-700 text-xs sm:text-sm">Longest</span>
                </div>
                {blendData.users && user1Id && user2Id && [user1Id, user2Id].map((userId) => {
                  const user = blendData.users[userId];
                  const book = user?.metrics?.longest_book_details;
                  return (
                    <div key={`longest-${userId}`} className="p-3 sm:p-4 border-l">
                      {book ? (
                        <div className="flex items-start gap-3">
                          {book.image && !book.image.includes('nophoto') && (
                            <img 
                              src={book.image} 
                              alt={book.title}
                              className="w-6 h-8 sm:w-8 sm:h-10 object-contain rounded-sm shadow-sm flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm text-gray-900 leading-tight break-words">{book.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{book.pages.toLocaleString()} pages</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm text-gray-400">No data</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Your Reading Connection */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Reading Connection</h2>

            {/* Shared Interests */}
            {blendData.ai_insights?.genre_insights && (
              <div className="bg-white rounded-lg p-6 shadow-md border rounded-lg">
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
              <div className="bg-white rounded-lg p-6 shadow-md border rounded-lg">
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

        {/* Books You Both Know - Enhanced with Read Status */}
        {blendData.common_books && blendData.common_books.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Books You Both Know</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span>✅</span>
                  <span>Read</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full border-2 opacity-50" style={{borderColor: '#DBD5C1'}}></div>
                  <span>On shelf (not read)</span>
                </div>
              </div>
            </div>
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
                  
                  // Primary sort by reading status priority
                  if (bPriority !== aPriority) {
                    return bPriority - aPriority;
                  }
                  
                  // Secondary sort by author name (alphabetical)
                  const authorCompare = (a.author || '').localeCompare(b.author || '');
                  if (authorCompare !== 0) {
                    return authorCompare;
                  }
                  
                  // Tertiary sort by book_id (numerical, for series ordering)
                  const aId = parseInt(a.book_id || '0');
                  const bId = parseInt(b.book_id || '0');
                  return aId - bId;
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
                          src={user1Id ? blendData.users?.[user1Id]?.image_url : undefined} 
                          alt={user1Name}
                          className={`w-6 h-6 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform ${user1Read ? 'border-green-500' : 'opacity-50'}`}
                          style={!user1Read ? {borderColor: '#DBD5C1'} : {}}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (user1Id) window.open(`https://www.goodreads.com/user/show/${user1Id}`, '_blank');
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
                          src={user2Id ? blendData.users?.[user2Id]?.image_url : undefined} 
                          alt={user2Name}
                          className={`w-6 h-6 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform ${user2Read ? 'border-green-500' : 'opacity-50'}`}
                          style={!user2Read ? {borderColor: '#DBD5C1'} : {}}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (user2Id) window.open(`https://www.goodreads.com/user/show/${user2Id}`, '_blank');
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
            className="bg-indigo-500 text-white px-6 py-2 rounded-full shadow-md hover:bg-indigo-600 transition-all duration-200"
          >
            <span className="mr-2">📤</span> Share This Blend
          </Button>
          <Button 
            onClick={handleReBlend} 
            disabled={loading}
            variant="secondary"
            className="px-6 py-2 rounded-full shadow-md transition-all duration-200"
          >
            <span className="mr-2">🔄</span> Re-Blend
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
