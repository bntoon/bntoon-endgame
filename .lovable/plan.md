
# Architecture Verification & Bunny.net Configuration Update

## Current State: Architecture Already Matches Requirements

Your project already follows the exact architecture you specified:

```text
+------------------+      +------------------+      +------------------+
|    Frontend      |      |     Backend      |      |    Storage       |
|    (React)       | <--> |  (Edge Functions)| <--> |                  |
+------------------+      +------------------+      +------------------+
        |                        |                        |
        |                        |                        |
   - Browse page            - /auth (login/verify)    - Bunny.net CDN
   - Series page            - /db (all CRUD ops)      - Images only
   - Reader                 - /upload (to Bunny)      - No metadata
   - Admin panel                  |                        
                                  v                        
                         +------------------+              
                         |    Database      |              
                         |  (Neon Postgres) |              
                         +------------------+              
                         - series                          
                         - chapters                        
                         - chapter_pages (URLs only)       
                         - genres                          
                         - series_genres                   
                         - chapter_views                   
```

### Current Components

| Component | Status | Technology |
|-----------|--------|------------|
| Frontend | Complete | React + Vite + Tailwind |
| Auth | Complete | JWT + SHA-256 password hashing |
| Database | Complete | Neon PostgreSQL via edge functions |
| File Upload | Complete | Bunny.net Storage API |
| CDN | Complete | Bunny.net CDN |

### Data Flow (Already Implemented)

1. **Admin uploads chapter images** via `/admin/series/:id/chapters`
2. **Frontend sends files** to `/upload` edge function with JWT token
3. **Edge function uploads** to Bunny Storage, receives CDN URL
4. **Edge function saves** only the URL to Neon database
5. **Frontend displays** images using Bunny CDN URLs

---

## Only Change Required: Update Bunny.net Secrets

Your Bunny.net credentials need updating in the backend secrets:

| Secret | Current | New Value |
|--------|---------|-----------|
| `BUNNY_CDN_HOSTNAME` | (old value) | `bntoon-storage.b-cdn.net` |
| `BUNNY_STORAGE_ZONE` | (old value) | `bntoonsto` |
| `BUNNY_STORAGE_API_KEY` | (old value) | `e77d78eb-838f-4485-b423054436e5-19c9-4101` |

---

## Implementation Steps

### Step 1: Update Backend Secrets
Update the three Bunny.net secrets via the secrets management tool.

### Step 2: Verify Upload Function
Confirm the upload edge function works correctly with the new credentials by testing a chapter upload.

---

## Technical Details

### Edge Functions (No Changes Needed)

**`/auth`** - Handles admin login/verify
- SHA-256 password hashing with salt
- JWT generation with 7-day expiry
- Constant-time password comparison

**`/db`** - All database operations
- Read operations: public access
- Write operations: require valid admin JWT
- Uses Neon serverless driver

**`/upload`** - File uploads to Bunny.net
- Requires admin JWT authentication
- Uploads to Bunny Storage API
- Returns public CDN URL
- Supports delete operations

### Database Schema (No Changes Needed)

All tables follow your spec with URLs only:

```text
chapter_pages
├── id (uuid, PK)
├── chapter_id (uuid, FK)
├── page_number (integer)
├── image_url (text) ← Bunny CDN URL only
└── created_at (timestamp)
```

---

## Summary

**Your architecture is already production-ready** and follows the exact pattern you specified. The only action needed is updating the Bunny.net secrets with your new credentials.
