# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Spa Pool Visualisation Web Application that uses AI (Google Gemini 2.5 Flash Image) to automatically place spa pools in user-uploaded images of their outdoor spaces.

## Core Features

1. **Image Upload**: Accepts JPEG, PNG, HEIC, WebP (max 20MB) via camera capture, file upload, or drag-and-drop
2. **Spa Pool Selection**: Grid display with filtering by size, shape, price, and colour options
3. **AI Placement**: Automatic positioning using Google Gemini 2.5 Flash Image API
4. **Position Adjustment**: Text prompts, click-to-place, and optional drag controls
5. **Output Options**: Download as JPEG/PNG/PDF, print with model details, share via email/social

## Technical Architecture

### Frontend Requirements
- Responsive web application with mobile-first design
- Modern browser support required
- Performance targets:
  - Page load: < 3 seconds
  - Image upload: < 5 seconds
  - AI processing: < 15 seconds
  - Position adjustment: < 5 seconds

### Backend Requirements
- Google Gemini 2.5 Flash Image API integration for AI placement
- Cloud file storage for uploaded images
- Image optimisation pipeline
- HTTPS encryption for all data handling
- Auto-delete uploaded images after set period

## Development Notes

Since this is a new project without existing code:
- Choose a modern web framework suitable for image manipulation (React, Vue, or similar)
- Set up proper image processing libraries for format conversion and optimisation
- Implement robust error handling for AI API failures
- Ensure responsive design works well on mobile devices for camera capture
- Consider implementing progressive enhancement for drag controls