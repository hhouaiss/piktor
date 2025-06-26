# Piktor V1

An AI-powered web application for generating consistent furniture product images. Upload images and 3D models of desks to create professional packshots, lifestyle images, and social media visuals.

## Features

### Core Functionality
- **File Upload**: Drag-and-drop interface for images (PNG/JPEG) and 3D models (OBJ/FBX)
- **Image Analysis**: Automatic extraction of visual attributes (color, material, dimensions, style)
- **JSON Prompt Generation**: AI-optimized prompts for GPT-4o image generation
- **Brand Templates**: Pre-designed templates for consistent styling
- **Image Preview**: Real-time preview of uploaded content and generated images

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Components**: Shadcn/ui
- **Styling**: Tailwind CSS
- **3D Rendering**: Three.js with React Three Fiber
- **File Upload**: React Dropzone
- **AI Integration**: OpenAI API (placeholder implementation)

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

1. Create a `.env.local` file in the root directory
2. Add your OpenAI API key:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

To get an OpenAI API key:
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste it into your `.env.local` file

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── upload/            # Upload page
│   ├── templates/         # Templates page
│   ├── preview/           # Preview page
│   └── layout.tsx         # Root layout
├── components/
│   ├── layout/            # Layout components
│   ├── upload/            # Upload-related components
│   └── ui/                # Shadcn UI components
└── lib/
    └── utils.ts           # Utility functions
```

## API Endpoints

- `POST /api/analyze-image` - Analyze uploaded images
- `POST /api/generate-prompt` - Generate JSON prompts from analysis
- `POST /api/openai-preview` - Generate AI image previews (mock)

## Features Overview

### Upload Page
- Drag-and-drop file upload
- Image and 3D model preview
- JSON prompt editor with form and raw JSON views
- Copy/download prompt functionality

### Templates Page
- Pre-designed brand templates
- Template categories (Packshot, Lifestyle, Instagram)
- Custom template creation

### Preview Page
- Generation queue tracking
- Image preview and comparison
- Download and sharing options

## Development Notes

- The application uses mock data for image analysis and AI generation
- 3D model viewing is implemented with Three.js
- All UI components follow accessibility best practices via Shadcn
- Responsive design optimized for desktop and mobile

## Future Enhancements

- Real image analysis using computer vision APIs
- Actual OpenAI API integration
- User authentication and project management
- Advanced 3D model processing
- Batch processing capabilities
- Export to various formats

## License

MIT License