# BookBlend Design Document

## Overview

BookBlend is a Next.js 14 web application that helps users discover book recommendations by "blending" their Goodreads libraries with friends. The app creates personalized reading suggestions based on shared interests and reading patterns between two users.

## Architecture

### Tech Stack
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **External API**: Custom BookBlend backend service

### Core Features
1. **User Profile Integration**: Connect Goodreads profiles via URL/ID
2. **Friend Discovery**: Browse and select from a user's Goodreads friends
3. **Book Blending**: Generate personalized recommendations between two users
4. **Share Links**: Create shareable URLs for easy blending with others
5. **Blend Caching**: Store and retrieve previous blend results
6. **Dedicated Blend Pages**: Persistent URLs for blend results

## Design System

### Typography
- **Primary Font**: Souvenir (serif) - Used for all headings (h1-h6)
- **Body Font**: Inter (sans-serif) - Used for body text and UI elements
- **Font Loading**: Optimized with `font-display: swap` for performance

### Color Palette
- **Primary**: `#6366f1` (indigo-500) - Main brand color for buttons and accents
- **Secondary**: Gray scale with enhanced contrast for accessibility
- **Success**: `#16a34a` (green-600) - Used for share buttons
- **Error**: `#dc2626` (red-600) - Used for error states

### Visual Design
- **Background**: Subtle noise texture (`/img/noise.png`) for depth
- **Rounded Corners**: Consistent 8px border radius (`--radius: 8px`)
- **Shadows**: Subtle drop shadows for depth and hierarchy

## Component Architecture

### UI Components (`/components/ui/`)
- **Button**: Variant-based button system (default, secondary, destructive, ghost)
- **Input**: Styled form inputs with consistent appearance
- **Avatar**: User profile images with fallback states
- **Spinner**: Loading indicators with optional labels
- **Toast**: Notification system for user feedback

### Feature Components (`/components/`)
- **FriendPicker**: Interactive list for selecting Goodreads friends
- **JsonView**: Collapsible JSON viewer for blend results (development aid)

### Design Patterns
- **Consistent Spacing**: Uses Tailwind's spacing scale for predictable layouts
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Accessibility**: Proper ARIA labels, keyboard navigation, and color contrast
- **Progressive Enhancement**: Works without JavaScript for core functionality

## Page Structure

### Homepage (`/app/page.tsx`)
**Purpose**: Primary user interface for creating blends

**Flow**:
1. **User Input**: Enter Goodreads profile URL or ID
2. **Friend Selection**: Choose from friends list OR enter second user manually
3. **Blend Creation**: Generate recommendations between two users
4. **Result Display**: Show blend results or redirect to dedicated page

**Key Features**:
- Smart paste detection for Goodreads URLs
- Overlapping avatar preview of selected users
- Local storage for user preference persistence
- Toast notifications for user feedback

### Share Page (`/app/share/[userId]/page.tsx`)
**Purpose**: Simplified interface for shared blend invitations

**Flow**:
1. **Display Share User**: Show the user who created the share link
2. **Second User Input**: Allow visitor to enter their Goodreads profile
3. **Blend Creation**: Generate blend between share user and visitor
4. **Redirect**: Navigate to dedicated blend result page

### Blend Result Page (`/app/blend/[id]/page.tsx`)
**Purpose**: Dedicated page for viewing and sharing blend results

**Implementation Status**: ✅ **COMPLETED**

**Current Features**:
- **Persistent URLs**: Each blend has a unique ID-based URL for sharing
- **User Display**: Shows both users with avatars, names, and blend creation date
- **Re-blend Functionality**: "Re-Blend" button with `force_new=true` parameter for fresh results
- **Copy Link**: "Copy Link" button for easy sharing via clipboard
- **Error Handling**: Comprehensive error states for missing blends, API failures
- **Loading States**: Spinner with descriptive labels during data fetching
- **JSON Result Display**: Uses JsonView component to show blend data

**UI Layout**:
- Header section with "Results" title and action buttons (Copy Link, Re-Blend)
- User info card with avatars, names, and creation date in gray background
- Result section displaying the blend data in collapsible JSON format

**Data Flow**:
- Fetches blend data from `/api/blend/[id]` endpoint
- Fetches user profile data for both users via `/api/user` endpoint
- Handles re-blending by calling `/api/blend` with `force_new=true`
- Implements client-side clipboard API for link copying

## Data Architecture

### Database Schema (Supabase)

#### Users Table
```sql
- id: string (Goodreads user ID)
- name: string
- image_url: string | null
- profile_url: string | null
- book_count: number | null
- created_at: timestamp
- updated_at: timestamp
```

#### Share Links Table
```sql
- id: uuid (primary key)
- user_id: string (references users.id)
- created_at: timestamp
- expires_at: timestamp | null
```

#### Blends Table
```sql
- id: uuid (primary key)
- user1_id: string (ordered consistently)
- user2_id: string (ordered consistently)
- blend_data: jsonb (full API response)
- created_at: timestamp
```

### API Routes

#### `/api/user` (GET)
- Fetches user data from Goodreads API
- Caches user information in database
- Returns user profile and friends list

#### `/api/blend` (GET)
- Creates or retrieves blend between two users
- Supports `force_new` parameter for fresh blends
- Caches results in database for performance

#### `/api/blend/[id]` (GET)
- Retrieves specific blend by ID
- Used by dedicated blend result pages

#### `/api/share` (POST)
- Creates share link for a user
- Generates unique URLs for blend invitations

## User Experience Patterns

### Input Handling
- **Smart Paste**: Automatically extracts Goodreads URLs from various clipboard formats
- **Flexible Input**: Accepts both full URLs and numeric user IDs
- **Validation**: Real-time validation with clear error messages

### Loading States
- **Progressive Loading**: Show spinners with descriptive labels
- **Optimistic Updates**: Update UI immediately where possible
- **Error Recovery**: Clear error messages with retry options

### Navigation Flow
- **Linear Progression**: Step-by-step process for creating blends
- **Persistent State**: Maintain user selections across page refreshes
- **Deep Linking**: Direct URLs for all major app states

## Performance Considerations

### Caching Strategy
- **User Data**: 24-hour cache for Goodreads user information
- **Blend Results**: Permanent storage with option to force refresh
- **API Responses**: No-store cache headers for dynamic content

### Optimization
- **Font Loading**: Optimized web font loading with fallbacks
- **Image Handling**: Lazy loading for user avatars
- **Bundle Size**: Minimal dependencies and tree-shaking

## Development Guidelines

### Code Organization
- **Feature-based Structure**: Group related components and logic
- **Type Safety**: Comprehensive TypeScript coverage
- **Consistent Naming**: Clear, descriptive variable and function names

### Styling Conventions
- **Utility-first**: Tailwind CSS for consistent styling
- **Component Variants**: Systematic approach to component variations
- **Responsive Design**: Mobile-first responsive breakpoints

### Error Handling
- **Graceful Degradation**: App remains functional with API failures
- **User Feedback**: Clear error messages and recovery paths
- **Logging**: Comprehensive error tracking for debugging

## Future Considerations

### Scalability
- **Database Indexing**: Optimize queries for user and blend lookups
- **CDN Integration**: Serve static assets from CDN
- **API Rate Limiting**: Implement rate limiting for external API calls

### Feature Enhancements
- **User Authentication**: Optional user accounts for personalization
- **Blend History**: Personal history of created blends
- **Social Features**: Comments and reactions on blend results
- **Advanced Filtering**: More sophisticated recommendation algorithms

### Accessibility
- **Screen Reader Support**: Enhanced ARIA labels and descriptions
- **Keyboard Navigation**: Complete keyboard accessibility
- **High Contrast Mode**: Support for high contrast themes

---

*This design document serves as a reference for understanding BookBlend's architecture and design patterns. It should be updated as the application evolves and new features are added.*
