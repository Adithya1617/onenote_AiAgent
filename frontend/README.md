# OneNote AI Assistant - Frontend

A modern, modular Next.js application providing a chatbot interface for the OneNote AI Assistant. This frontend application allows users to interact with the AI through text messages, image uploads, and audio file uploads.

## 🚀 Features

### Core Functionality
- **💬 Chat Interface**: Modern, responsive chat interface with real-time messaging
- **📤 File Upload**: Drag-and-drop support for images, audio, and text files
- **🖼️ Image Processing**: OCR capabilities for extracting text from images
- **🎵 Audio Transcription**: Speech-to-text conversion for audio files
- **📔 OneNote Integration**: Automatic organization of content into OneNote notebooks and sections

### User Experience
- **🎨 Modern UI**: Clean, professional design with smooth animations
- **📱 Responsive Design**: Works seamlessly across desktop and mobile devices
- **⚡ Real-time Updates**: Live feedback during file processing
- **🔄 Error Handling**: Comprehensive error handling with user-friendly messages
- **⌨️ Keyboard Shortcuts**: Support for Enter to send messages

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **UI Components**: Custom components built with Radix UI primitives

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Running OneNote AI backend service

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment**:
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. **Start development server**:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── chat/             # Chat-related components
│   ├── upload/           # File upload components
│   └── OneNoteChatbot.tsx # Main component
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
└── types/                # TypeScript definitions
```

## 🎨 Features

- **Modular Architecture**: Scalable component structure
- **Type Safety**: Full TypeScript implementation
- **Modern UI**: Clean design with smooth animations
- **File Upload**: Drag-and-drop with preview
- **Real-time Chat**: Instant messaging interface
- **Error Handling**: User-friendly error messages
