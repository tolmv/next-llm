# Conversation System Refactor

This document outlines the refactoring of the chat system to support conversation management with persistent history.

## What Changed

### 1. Database Schema Updates

**New Table: `conversations`**
- `id` (uuid): Primary key
- `user_id` (text): Owner of the conversation
- `title` (text): Auto-generated from first message or manually set
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last activity timestamp

**Updated Table: `chat_messages`**
- Added `conversation_id` (uuid): Foreign key to conversations table
- Messages now belong to a conversation
- Cascade delete: deleting a conversation removes all its messages

### 2. New API Routes

**`/api/conversations`**
- `GET`: List all conversations for the authenticated user (sorted by most recent)
- `POST`: Create a new conversation

**`/api/conversations/[id]`**
- `GET`: Get conversation details with all messages
- `PATCH`: Update conversation title
- `DELETE`: Delete a conversation (and all its messages)

**`/api/chat` (updated)**
- Now accepts `conversationId` in request body
- Auto-creates conversation if none provided
- Saves both user and assistant messages to database
- Auto-generates conversation titles from first user message
- Updates conversation `updatedAt` timestamp on each message

### 3. New Pages & Components

**Page: `/conversation/[id]`**
- Main chat interface for a specific conversation
- Loads conversation history from database
- Real-time streaming responses

**Component: `ConversationSelector`**
- Lists all user conversations
- Create new conversation button
- Delete conversation functionality
- Shows current conversation highlight

**Component: `ConversationView`**
- Main chat interface with message history
- Integrates with AI SDK for streaming
- Loads existing messages on mount
- Sidebar with conversation selector

### 4. Home Page Update

The home page (`/`) now shows:
- Quick links (sign in/up, account settings)
- Conversation selector in the sidebar
- Welcome message prompting users to start or select a conversation

## How to Apply the Migration

1. **Ensure your database is running**

2. **Run the migration**:
   ```bash
   npx drizzle-kit push
   ```

   Or if you prefer to apply the SQL manually:
   ```bash
   psql $DATABASE_URL -f db/migrations/0001_narrow_morg.sql
   ```

3. **Restart your development server**:
   ```bash
   npm run dev
   ```

## Usage

### Creating a New Conversation

1. Click the "New" button in the conversation selector
2. You'll be redirected to `/conversation/[id]`
3. Start chatting - the title will auto-generate from your first message

### Viewing Past Conversations

1. All conversations appear in the selector on the home page or in the sidebar
2. Click any conversation to open it
3. Full message history is preserved

### Deleting a Conversation

1. Hover over a conversation in the selector
2. Click the trash icon that appears
3. Confirm deletion
4. All messages in that conversation are also deleted (cascade)

## Technical Details

### Message Persistence

- **User messages**: Saved immediately when sent
- **Assistant messages**: Saved when streaming completes (using `onFinish` callback)
- **Format**: Messages stored as plain text in the database

### Conversation Titles

- Auto-generated from first 50 characters of first user message
- Can be updated via PATCH `/api/conversations/[id]`
- Defaults to "New Conversation" if not set

### State Management

- Frontend uses AI SDK's `useChat` hook
- Messages loaded from database on mount
- Real-time updates during streaming
- Conversation selector refreshes after create/delete operations

## Migration Path for Existing Data

If you have existing messages in `chat_messages` without `conversation_id`:

1. The new migration will fail because `conversation_id` is required
2. You have two options:

   **Option A: Clean slate (recommended for development)**
   ```sql
   DROP TABLE chat_messages;
   ```
   Then run the migration.

   **Option B: Migrate existing messages**
   ```sql
   -- Create conversations for existing messages
   INSERT INTO conversations (user_id, title, created_at, updated_at)
   SELECT DISTINCT 
     user_id, 
     'Migrated Conversation' as title,
     MIN(created_at) as created_at,
     MAX(created_at) as updated_at
   FROM chat_messages
   WHERE user_id IS NOT NULL
   GROUP BY user_id;

   -- Update messages with conversation_id
   UPDATE chat_messages cm
   SET conversation_id = (
     SELECT c.id 
     FROM conversations c 
     WHERE c.user_id = cm.user_id 
     LIMIT 1
   );
   ```

## API Changes

### Before
```typescript
// POST /api/chat
{
  "messages": [...]
}
```

### After
```typescript
// POST /api/chat
{
  "messages": [...],
  "conversationId": "uuid-here" // optional, auto-creates if missing
}
```

## Next Steps

Potential enhancements:
- [ ] Add conversation search functionality
- [ ] Add conversation sharing/export
- [ ] Add message editing/regeneration
- [ ] Add conversation folders/tags
- [ ] Add conversation analytics
- [ ] Add message reactions/favorites
