import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Chat, Part } from "@google/genai";

// --- Icons (SVG) ---
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
);
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
);
const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1c-.55 0-1.05-.11-1.5-.31A7.95 7.95 0 0 1 12 24a7.95 7.95 0 0 1-6.5-4.31A3.97 3.97 0 0 1 5 21H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h1a7 7 0 0 1 7-7v-1.27c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2Z"/><path d="M9 11h.01"/><path d="M15 11h.01"/></svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
);
const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12" rx="2" ry="2"/></svg>
);
const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
);
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);

// --- Types ---
interface Message {
  role: 'user' | 'model';
  text?: string;
  audioUrl?: string; // If the message contains audio
  imageUrl?: string; // If the message contains an image
}

interface FileData {
  name: string;
  type: string;
  data: string; // base64 without prefix
  url: string; // for iframe/img
}

// --- App Component ---
const App = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [file, setFile] = useState<FileData | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Attachments in Chat
  const [chatAttachment, setChatAttachment] = useState<FileData | null>(null);
  
  // Voice Recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const landingFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, hasStarted]);

  // Helper: Read file as Base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Initialize Chat with Gemini (supports optional docFile)
  const initializeChat = async (docFile: FileData | null): Promise<Chat | null> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let systemInstruction = "You are a helpful AI assistant.";
      let initialHistory: any[] = [];

      if (docFile) {
        systemInstruction += " You have access to the attached document (PDF or Image). Your goal is to answer the user's questions based on the content of the document, as well as general knowledge if requested. Be concise and helpful.";
        initialHistory = [
          {
            role: 'user',
            parts: [
              { 
                inlineData: { 
                  mimeType: docFile.type, 
                  data: docFile.data 
                } 
              },
              { text: "Analyze this document/image and prepare to answer questions about it." }
            ]
          },
          {
            role: 'model',
            parts: [{ text: `I have analyzed "${docFile.name}". I am ready to answer your questions.` }]
          }
        ];
      } else {
        systemInstruction += " Answer user questions concisely and helpfully.";
      }

      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          temperature: 0.2, 
          systemInstruction: systemInstruction,
        },
        history: initialHistory
      });

      setChatSession(chat);
      return chat;
    } catch (err) {
      console.error(err);
      setError('Failed to initialize AI session. Please check your API key.');
      return null;
    }
  };

  // Shared: Process Stream Response
  const processStreamResponse = async (result: any) => {
      let fullResponse = "";
      setMessages(prev => [...prev, { role: 'model', text: "" }]);

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          fullResponse += text;
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1].text = fullResponse;
            return newMsgs;
          });
        }
      }
      setIsSending(false);
  };

  // --- Landing Page Handlers ---

  const handleLandingFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/heic'];
    if (!validTypes.includes(uploadedFile.type)) {
      setError('Please upload a valid PDF or Image file.');
      return;
    }

    try {
      const base64 = await readFileAsBase64(uploadedFile);
      const base64Data = base64.split(',')[1];
      const newFile = {
        name: uploadedFile.name,
        type: uploadedFile.type,
        data: base64Data,
        url: base64
      };

      setFile(newFile);
      setHasStarted(true);
      
      const chat = await initializeChat(newFile);
      if (chat) {
        setMessages([{ role: 'model', text: `I've analyzed **${newFile.name}**. Ask me anything about it!` }]);
      }
    } catch (err) {
      setError('Failed to read file.');
    }
  };

  const handleLandingTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    setIsSending(true);
    setHasStarted(true);
    
    // Start fresh chat without file context
    const chat = await initializeChat(null);
    const textToSend = inputText;
    setInputText(''); // Clear input for the chat view

    setMessages([{ role: 'user', text: textToSend }]);
    
    if (chat) {
      try {
        const result = await chat.sendMessageStream({ message: textToSend });
        await processStreamResponse(result);
      } catch (err) {
        setMessages(prev => [...prev, { role: 'model', text: "Error connecting to AI." }]);
        setIsSending(false);
      }
    }
  };

  // --- Voice Handlers (Shared) ---
  
  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          
          if (!hasStarted) {
             // Landing Page Recording
             setHasStarted(true);
             const chat = await initializeChat(null);
             await handleSendAudio(base64Audio, chat);
          } else {
             // Chat Page Recording
             await handleSendAudio(base64Audio, chatSession);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Microphone access denied. Please allow permissions in your browser.");
      } else {
        setError(`Microphone error: ${err.message || 'Unknown error'}`);
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendAudio = async (base64Audio: string, chat: Chat | null) => {
    if (!chat) return;
    
    const audioData = base64Audio.split(',')[1];
    const mimeType = 'audio/webm';

    setMessages(prev => [...prev, { role: 'user', audioUrl: base64Audio, text: "🎤 Voice Message" }]);
    setIsSending(true);

    try {
      const result = await chat.sendMessageStream({
        message: [
          { inlineData: { mimeType, data: audioData } },
          { text: "Please listen to this audio and respond to the user's request." }
        ]
      });
      await processStreamResponse(result);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Error processing voice input." }]);
      setIsSending(false);
    }
  };

  // --- Chat Page Message Handler ---
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && !chatAttachment) || !chatSession || isSending) return;

    const userText = inputText.trim();
    const currentAttachment = chatAttachment;

    setInputText('');
    setChatAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError(null);

    setMessages(prev => [
      ...prev, 
      { 
        role: 'user', 
        text: userText, 
        imageUrl: currentAttachment?.url 
      }
    ]);
    setIsSending(true);

    try {
      let messageParts: (string | Part)[] = [];
      
      if (currentAttachment) {
        messageParts.push({
          inlineData: {
            mimeType: currentAttachment.type,
            data: currentAttachment.data
          }
        });
      }
      
      if (userText) {
        messageParts.push({ text: userText });
      } else if (currentAttachment) {
         messageParts.push({ text: "Describe this image." });
      }

      const result = await chatSession.sendMessageStream({ message: messageParts });
      await processStreamResponse(result);

    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Error: Could not generate response." }]);
      setIsSending(false);
    }
  };

  const handleChatAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await readFileAsBase64(file);
      setChatAttachment({
        name: file.name,
        type: file.type,
        data: base64.split(',')[1],
        url: base64
      });
      setError(null);
    } catch (err) {
      setError("Failed to attach file.");
    }
  };

  const resetSession = () => {
    setFile(null);
    setChatSession(null);
    setMessages([]);
    setError(null);
    setChatAttachment(null);
    setIsRecording(false);
    setHasStarted(false);
    setInputText('');
  };

  // --- Render: Landing Page ---
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl mix-blend-screen animate-pulse"></div>
           <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl mix-blend-screen animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="max-w-2xl w-full z-10 flex flex-col items-center">
          
          <div className="flex items-center gap-3 mb-6">
             <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
               <SparkleIcon />
             </div>
             <h1 className="text-4xl font-bold text-white tracking-tight">AI Chat Assistant</h1>
          </div>
          
          <p className="text-slate-400 mb-10 text-center text-lg max-w-md">
            Ask anything, upload documents, or use voice to get started immediately.
          </p>
          
          {/* Main Search Bar */}
          <div className="w-full relative group">
             <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-50 group-hover:opacity-100 transition duration-300 blur-sm"></div>
             <form onSubmit={handleLandingTextSubmit} className="relative bg-slate-900 rounded-2xl flex items-center p-2 border border-slate-700">
                
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isRecording ? "Listening..." : "Type your question here..."}
                  className={`flex-1 bg-transparent text-white placeholder-slate-500 px-4 py-3 focus:outline-none text-lg ${isRecording ? 'animate-pulse text-red-400' : ''}`}
                  disabled={isRecording}
                />
                
                <div className="flex items-center gap-2 pr-2">
                   <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-3 rounded-xl transition-colors ${
                      isRecording 
                        ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title="Voice Input"
                   >
                     {isRecording ? <StopIcon /> : <MicIcon />}
                   </button>
                   
                   <button 
                     type="submit" 
                     className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50"
                     disabled={!inputText.trim() && !isRecording}
                   >
                     <SendIcon />
                   </button>
                </div>
             </form>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <span className="text-slate-500 text-sm font-medium">OR</span>
            
            <div className="flex gap-4">
              <input 
                 type="file" 
                 className="hidden" 
                 ref={landingFileInputRef}
                 accept="application/pdf,image/*"
                 onChange={handleLandingFileUpload}
              />
              <button 
                onClick={() => landingFileInputRef.current?.click()}
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl text-slate-300 transition-all shadow-sm hover:shadow-md"
              >
                <UploadIcon />
                <span>Upload Document / Image</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-8 p-4 bg-red-900/30 border border-red-900/50 text-red-200 rounded-xl flex items-center gap-3 max-w-md animate-in fade-in slide-in-from-bottom-2">
              <div className="p-1 bg-red-500/20 rounded-full"><XIcon /></div>
              <span className="text-sm">{error}</span>
            </div>
          )}

        </div>
        
        <div className="absolute bottom-6 text-slate-600 text-sm">
           Powered by Gemini 2.5 Flash
        </div>
      </div>
    );
  }

  // --- Render: Main Chat Interface ---
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      
      {/* Left Panel: File Viewer (Only if file exists) */}
      {file && (
        <div className="hidden lg:flex flex-col w-1/2 border-r border-slate-800 bg-slate-900">
          <div className="h-16 border-b border-slate-800 flex items-center px-6 justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <FileIcon />
              </div>
              <span className="font-medium text-slate-200 truncate max-w-[300px]" title={file.name}>
                {file.name}
              </span>
            </div>
            {/* Close File button triggers reset, which goes back to landing page */}
            <button 
              onClick={resetSession}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
              title="Close File"
            >
              <TrashIcon />
            </button>
          </div>
          <div className="flex-1 bg-slate-800 relative flex items-center justify-center overflow-hidden">
            {file.type === 'application/pdf' ? (
              <object data={file.url} type="application/pdf" className="w-full h-full">
                <div className="text-slate-400 p-4 text-center">
                   Cannot display PDF. <a href={file.url} download className="text-blue-400 underline">Download</a>
                </div>
              </object>
            ) : (
               <img src={file.url} alt="Uploaded content" className="max-w-full max-h-full object-contain p-4" />
            )}
          </div>
        </div>
      )}

      {/* Right Panel: Chat Interface */}
      <div className={`w-full ${file ? 'lg:w-1/2' : 'lg:w-full'} flex flex-col h-full bg-slate-950 relative transition-all duration-300`}>
        
        {/* Header */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900">
           <div className="flex items-center gap-3">
              <button onClick={resetSession} className="text-slate-400 hover:text-white lg:hidden">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span className="font-semibold text-slate-100 flex items-center gap-2">
                <SparkleIcon />
                AI Assistant
              </span>
           </div>
           
           {/* If no file is open, show an "Exit" or "New Chat" button to go back to landing */}
           {!file && (
             <button onClick={resetSession} className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 bg-slate-800 rounded-lg transition-colors">
               New Chat
             </button>
           )}
        </div>

        {/* Error Toast */}
        {error && (
            <div className="absolute top-20 left-4 right-4 z-50 bg-red-500/90 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between backdrop-blur-sm animate-in fade-in slide-in-from-top-2 max-w-2xl mx-auto">
              <span className="text-sm font-medium">{error}</span>
              <button onClick={() => setError(null)} className="ml-3 p-1 hover:bg-white/20 rounded-lg transition-colors">
                <XIcon />
              </button>
            </div>
        )}

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
          {/* Centered welcome message if empty history in chat mode (rare but possible) */}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
               <BotIcon />
               <p className="mt-2 text-sm">Start the conversation...</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-4xl mx-auto w-full`}>
              
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-white mt-1 shadow-md shadow-blue-900/20">
                  <BotIcon />
                </div>
              )}

              <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="User attachment" className="mb-2 max-w-full h-auto rounded-xl border border-slate-700 max-h-60" />
                )}

                {msg.audioUrl && (
                  <div className="mb-2">
                     <audio controls src={msg.audioUrl} className="h-10 w-64 rounded-lg bg-slate-100" />
                  </div>
                )}
                
                {msg.text && (
                  <div 
                    className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                        : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
                    }`}
                  >
                    {msg.text}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-slate-300 mt-1">
                  <UserIcon />
                </div>
              )}
            </div>
          ))}
          
          {isSending && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-4 max-w-4xl mx-auto w-full">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white mt-1 animate-pulse">
                <BotIcon />
              </div>
              <div className="bg-slate-800 border border-slate-700 px-5 py-4 rounded-2xl rounded-tl-sm flex gap-2 items-center">
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <div className="max-w-3xl mx-auto">
            {/* Attachment Preview */}
            {chatAttachment && (
               <div className="flex items-center gap-2 mb-2 p-2 bg-slate-800 rounded-lg w-fit border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
                  <img src={chatAttachment.url} alt="Preview" className="w-8 h-8 rounded object-cover" />
                  <span className="text-xs text-slate-300 max-w-[150px] truncate">{chatAttachment.name}</span>
                  <button 
                    onClick={() => { setChatAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="text-slate-400 hover:text-red-400 ml-2"
                  >
                    <XIcon />
                  </button>
               </div>
            )}

            <div className="relative flex items-end gap-2">
              
              {/* Image Upload Button */}
              <div className="relative">
                <input 
                   type="file" 
                   accept="image/*" 
                   className="hidden" 
                   ref={fileInputRef}
                   onChange={handleChatAttachment}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending || isRecording}
                  className="p-3 bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
                  title="Attach Image"
                >
                  <ImageIcon />
                </button>
              </div>

              {/* Mic / Text Input */}
              <form onSubmit={handleSendMessage} className="flex-1 relative">
                 <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isRecording ? "Listening..." : "Type or use voice..."}
                  className={`w-full bg-slate-800 text-slate-200 placeholder-slate-500 rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-slate-700 transition-all ${isRecording ? 'animate-pulse border-red-500/50' : ''}`}
                  disabled={isSending || isRecording}
                />
                
                <button 
                  type="submit"
                  disabled={(!inputText.trim() && !chatAttachment) || isSending || isRecording}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-0 disabled:hover:bg-blue-600 transition-all transform scale-100 disabled:scale-90"
                >
                  <SendIcon />
                </button>
              </form>

              {/* Voice Record Button */}
              <button
                 type="button"
                 onClick={isRecording ? stopRecording : startRecording}
                 disabled={isSending}
                 className={`p-3 rounded-xl border transition-colors ${
                   isRecording 
                    ? 'bg-red-500/20 text-red-500 border-red-500 hover:bg-red-500/30' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'
                 }`}
                 title={isRecording ? "Stop Recording" : "Start Voice Input"}
              >
                {isRecording ? <StopIcon /> : <MicIcon />}
              </button>

            </div>
            
            <div className="text-center mt-2">
              <p className="text-xs text-slate-500">
                Powered by Gemini 2.5 Flash
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);