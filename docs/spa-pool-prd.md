# Product Requirements Document
## Spa Pool Visualisation Web Application

---

## Core Functionality

### 1. Image Upload
- **Accepted formats:** JPEG, PNG, HEIC, WebP
- **Max file size:** 20MB
- **Upload methods:** Camera capture, file upload, drag-and-drop

### 2. Spa Pool Selection
- **Catalogue display:** Grid of available spa pool models
- **Model information:** Dimensions, capacity, price
- **Filtering:** By size, shape, price range
- **Colour options:** Multiple finishes per model

### 3. AI Placement (Google Gemini 2.5 Flash Image)
- **Automatic positioning:** AI analyses image and places spa in optimal location
- **Considerations:** Flat surfaces, scale, perspective, lighting
- **Processing time:** Target < 15 seconds

### 4. Position Adjustment
- **Primary method - Text prompts:**
  - Pre-defined commands: "move left", "rotate 90°", "make smaller"
  - Natural language: "place near the deck"
- **Secondary method - Click-to-place:**
  - User clicks desired location
  - System snaps to viable position
- **Optional - Drag controls:**
  - Manual positioning with rotation/scale handles

### 5. Loading Feedback
- **Visual indicators:** Spinner/progress bar during AI processing
- **Status messages:** "Analysing your space...", "Positioning spa pool..."
- **Error handling:** Clear error messages with suggested actions

### 6. Output
- **Download options:** JPEG, PNG, PDF
- **Print function:** Formatted with model details
- **Sharing:** Email, social media

## Technical Requirements

### Frontend
- Responsive web application
- Mobile-first design
- Modern browser support

### Backend
- Google Gemini 2.5 Flash Image API integration
- Cloud file storage
- Image optimisation pipeline

### Performance Targets
- Page load: < 3 seconds
- Image upload: < 5 seconds
- AI processing: < 15 seconds
- Position adjustment: < 5 seconds

### Data Handling
- HTTPS encryption
- Auto-delete uploaded images after set period
- No permanent storage without consent