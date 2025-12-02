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

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Handle Primary File Upload (PDF or Image)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    // Validate type
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
      setError(null);
      initializeChat(newFile);
      
    } catch (err) {
      console.error(err);
      setError('Failed to read file.');
    }
  };

  // Helper: Read file as Base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Initialize Chat with Gemini
  const initializeChat = async (docFile: FileData) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          temperature: 0.2, 
          systemInstruction: "You are a helpful AI assistant. You have access to the attached document (PDF or Image). Your goal is to answer the user's questions based on the content of the document, as well as general knowledge if requested. Be concise and helpful.",
        },
        history: [
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
        ]
      });

      setChatSession(chat);
      setMessages([
        { role: 'model', text: `I've analyzed **${docFile.name}**. You can ask me questions about it, upload more images, or use voice input!` }
      ]);
    } catch (err) {
      console.error(err);
      setError('Failed to initialize AI session. Please check your API key.');
    }
  };

  // Handle Recording Logic
  const startRecording = async () => {
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
          // Send audio as message
          await handleSendAudio(base64Audio);
        };
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone. Please allow permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Send Audio Message
  const handleSendAudio = async (base64Audio: string) => {
    if (!chatSession) return;
    
    const audioData = base64Audio.split(',')[1];
    const mimeType = 'audio/webm'; // MediaRecorder usually defaults to this

    setMessages(prev => [...prev, { role: 'user', audioUrl: base64Audio, text: "🎤 Voice Message" }]);
    setIsSending(true);

    try {
      const result = await chatSession.sendMessageStream({
        message: [
          { inlineData: { mimeType, data: audioData } },
          { text: "Please listen to this audio and respond to the user's request." }
        ]
      });
      
      await processStreamResponse(result);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "Error processing voice input." }]);
      setIsSending(false);
    }
  };

  // Handle Text/Image Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && !chatAttachment) || !chatSession || isSending) return;

    const userText = inputText.trim();
    const currentAttachment = chatAttachment; // Capture ref

    // Clear inputs immediately
    setInputText('');
    setChatAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Optimistic UI Update
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
         // If only image is sent, add a prompt
         messageParts.push({ text: "Describe this image." });
      }

      const result = await chatSession.sendMessageStream({ message: messageParts });
      await processStreamResponse(result);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "Error: Could not generate response." }]);
      setIsSending(false);
    }
  };

  // Shared Helper to process stream
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
    } catch (err) {
      console.error("Error reading attachment", err);
    }
  };

  const resetSession = () => {
    setFile(null);
    setChatSession(null);
    setMessages([]);
    setError(null);
    setChatAttachment(null);
  };

  // --- Render: Upload Screen ---
  if (!file) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <UploadIcon />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Chat Assistant</h1>
          <p className="text-slate-400 mb-8">Upload a Document (PDF) or Image to start.</p>
          
          <label className="group relative flex flex-col items-center justify-center w-full h-48 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer hover:border-blue-500 hover:bg-slate-800/50 transition-all">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadIcon />
              <p className="mt-2 text-sm text-slate-400 group-hover:text-slate-300">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500 mt-1">PDF, PNG, JPG (Max 20MB)</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept="application/pdf,image/*"
              onChange={handleFileUpload}
            />
          </label>
          
          {error && (
            <div className="mt-4 p-3 bg-red-900/30 text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Render: Split Screen Interface ---
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      
      {/* Left Panel: File Viewer */}
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

      {/* Right Panel: Chat Interface */}
      <div className="w-full lg:w-1/2 flex flex-col h-full bg-slate-950 relative">
        
        {/* Mobile Header */}
        <div className="lg:hidden h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900">
           <span className="font-medium text-slate-200 truncate">{file.name}</span>
           <button onClick={resetSession} className="text-slate-400"><TrashIcon /></button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-white mt-1">
                  <BotIcon />
                </div>
              )}

              <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                
                {/* Image Attachment in Chat */}
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="User attachment" className="mb-2 max-w-full h-auto rounded-lg border border-slate-700 max-h-60" />
                )}

                {/* Audio Attachment in Chat */}
                {msg.audioUrl && (
                  <div className="mb-2">
                     <audio controls src={msg.audioUrl} className="h-10 w-64 rounded-lg bg-slate-100" />
                  </div>
                )}
                
                {/* Text Message */}
                {msg.text && (
                  <div 
                    className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap ${
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
            <div className="flex gap-4">
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
          
          {/* Attachment Preview */}
          {chatAttachment && (
             <div className="flex items-center gap-2 mb-2 p-2 bg-slate-800 rounded-lg w-fit border border-slate-700">
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

          <div className="relative max-w-3xl mx-auto flex items-end gap-2">
            
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
                className={`w-full bg-slate-800 text-slate-200 placeholder-slate-500 rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-slate-700 ${isRecording ? 'animate-pulse border-red-500/50' : ''}`}
                disabled={isSending || isRecording}
              />
              
              {/* Send Button */}
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
              Powered by Gemini 2.5 Flash. Upload text, images, or speak.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);