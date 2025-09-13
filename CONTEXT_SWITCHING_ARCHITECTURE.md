# ArtisAI Context Switching Architecture

## Overview
ArtisAI uses a clear context switching approach to handle different modes of interaction with users, ensuring Gemini AI always knows its role and expected output format.

## Context Modes

### 1. Questionnaire Mode
**Purpose**: Collect user information through adaptive questions
**Location**: Client-side (static questions)
**AI Role**: Not used (static questionnaire)
**Output**: User answers stored in state

**Features**:
- Static, adaptive questions based on user responses
- "Other" textbox for custom inputs
- No API calls during questionnaire
- Smart question generation based on missing information

### 2. Flow Generation Mode
**Purpose**: Generate personalized business flowchart from collected answers
**Location**: Server-side (`/api/questionnaire/generate-flow`)
**AI Role**: Flow generator with specific JSON output requirements
**Output**: Structured JSON with nodes and edges

**Features**:
- Clear context: "You are now in FLOW GENERATION MODE"
- Specific JSON structure requirements
- Craft-specific, location-aware flow generation
- No explanations, only JSON output

### 3. General AI Chat Mode
**Purpose**: Handle general AI assistance and location queries
**Location**: Server-side (`/api/ai/chat`)
**AI Role**: ArtisAI business assistant
**Output**: Conversational responses

**Features**:
- General business advice
- Location-based supplier/market searches
- Marketing and pricing assistance
- Conversational tone

## Context Switching Flow

```
User starts → Questionnaire Mode (static) → Collects 6-8 answers → 
Flow Generation Mode (Gemini) → Generates JSON flowchart → 
Business Flow Canvas (React Flow) → User can continue with General AI Chat
```

## Gemini Prompt Structure

### Flow Generation Mode Prompt:
```
You are ArtisAI, an AI assistant for Indian artisans. You are now in FLOW GENERATION MODE.

## Context: Flow Generation Mode
- Read the user's answers below
- Build a business flowchart that shows the artisan's journey
- Output in JSON with "nodes" and "edges"
- Each node must have the exact structure specified
- Do not add explanations, only return JSON

## Required JSON Structure:
{
  "nodes": [
    {
      "id": "string",
      "title": "string", 
      "description": "string",
      "type": "milestone|action|resource",
      "quickActions": ["list of dynamic quick action suggestions"],
      "children": ["list of child node ids"]
    }
  ],
  "edges": [
    {"from": "string", "to": "string"}
  ]
}
```

## Benefits of Context Switching

1. **Clear AI Role**: Gemini always knows what mode it's in
2. **Consistent Output**: Predictable JSON structure for flow generation
3. **Efficient Quota Usage**: Only 1 API call per questionnaire completion
4. **Better User Experience**: Smooth transition between modes
5. **Maintainable Code**: Clear separation of concerns

## Implementation Details

### Client-Side (Questionnaire Mode)
- Static question generation
- Adaptive based on user answers
- No API calls during questions
- Smooth user experience

### Server-Side (Flow Generation Mode)
- Single Gemini API call
- Clear context switching prompt
- Structured JSON output
- Error handling with fallbacks

### Server-Side (General AI Chat Mode)
- Conversational AI assistance
- Location-based queries
- Business advice and support
- Multiple API calls as needed

## Error Handling

- **Flow Generation Fails**: Falls back to mock flow
- **API Quota Exceeded**: Uses adaptive fallback questions
- **Invalid JSON**: Parses and validates before returning
- **Network Issues**: Graceful degradation with user feedback

This architecture ensures ArtisAI provides a smooth, efficient, and reliable experience for Indian artisans building their business roadmaps.




