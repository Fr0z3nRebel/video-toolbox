# Tool Architecture Documentation

This directory contains the video processing tools for the Video Toolbox application.

## Architecture Pattern

Each tool follows this structure:

```
tool-name/
├── page.tsx           # UI components and React state management
└── functions.ts       # Business logic and processing functions
```

## Current Tools

### Frame Extractor (`frame-extractor/`)

**Purpose:** Extract the first or last frame from video files.

**Files:**

- `page.tsx` - UI components and state management
- `functions.ts` - Video frame extraction logic using HTML5 Video + Canvas APIs

**Key Functions:**

- `extractFrameFromVideo()` - Extract a single frame at specified position
- `extractFrames()` - Process multiple video files
- `getOriginalFileForComparison()` - Helper for before/after comparisons

**Use Case:**

- Extract last frame of AI-generated video to use as first frame of next generation
- Create thumbnails from videos
- Extract specific frames for analysis

## Development Guidelines

When creating new tools, follow the existing pattern:

1. Create `functions.ts` with core processing logic
2. Create `page.tsx` using reusable components from `../../components/`
3. Use client-side processing where possible for privacy
4. All video processing uses HTML5 Video + Canvas APIs (no server required)
