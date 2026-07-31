'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Play, Pause, AlertCircle, Bot, User, Loader2, BookOpen } from 'lucide-react';
import constitutionData from '../data/constitution.json';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EdgeTTSClient, OUTPUT_FORMAT } from 'edge-tts-client';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export default function Constitution() {
  const [selectedSectionId, setSelectedSectionId] = useState(constitutionData.sections[0].id);
  const [playingArticleNum, setPlayingArticleNum] = useState<number | null>(null);
  const [playingQaId, setPlayingQaId] = useState<number | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  
  const [questionText, setQuestionText] = useState('');
  const [chatLog, setChatLog] = useState<ChatMessage[]>([{
    role: 'ai', 
    text: 'Сәлеметсіз бе! Мен Қазақстан Республикасының Конституциясы бойынша ИИ-көмекшімін. Дауыспен немесе мәтінмен сұрақ қойсаңыз болады.'
  }]);
  const [errorMsg, setErrorMsg] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const qaAudioRef = useRef<HTMLAudioElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Recording refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);

  // Initialize Gemini
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  const genAI = new GoogleGenerativeAI(apiKey);

  const selectedSection = constitutionData.sections.find(s => s.id === selectedSectionId) || constitutionData.sections[0];

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatLog, isProcessing]);

  const playClientTTS = async (text: string, isQa: boolean, id: number) => {
    try {
      if (isQa) {
        if (qaAudioRef.current) {
          qaAudioRef.current.pause();
          qaAudioRef.current.currentTime = 0;
        }
        if (playingQaId === id) {
          setPlayingQaId(null);
          return;
        }
        setPlayingQaId(id);
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        if (playingArticleNum === id) {
          setPlayingArticleNum(null);
          return;
        }
        setPlayingArticleNum(id);
      }

      const client = new EdgeTTSClient();
      await client.setMetadata('kk-KZ-AigulNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      
      const stream = client.toStream(text);
      const chunks: any[] = [];
      
      stream.on('data', (chunk: any) => {
        chunks.push(new Uint8Array(chunk));
      });
      
      stream.on('end', () => {
        client.close(); // Important: close WebSocket
        
        // Check if user cancelled while loading
        if (isQa && playingQaId !== id) return;
        if (!isQa && playingArticleNum !== id) return;
        
        const blob = new Blob(chunks as BlobPart[], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        
        audio.onended = () => {
          if (isQa) setPlayingQaId(null);
          else setPlayingArticleNum(null);
          URL.revokeObjectURL(url);
        };
        
        audio.onerror = () => {
          console.error('TTS playback error');
          if (isQa) setPlayingQaId(null);
          else setPlayingArticleNum(null);
          URL.revokeObjectURL(url);
        };
        
        if (isQa) {
          qaAudioRef.current = audio;
        } else {
          audioRef.current = audio;
        }
        
        audio.play().catch(err => {
          console.error('Autoplay error', err);
          if (isQa) setPlayingQaId(null);
          else setPlayingArticleNum(null);
        });
      });
      
      stream.on('close', () => {
        client.close();
      });
    } catch (err) {
      console.error('TTS error', err);
      if (isQa) setPlayingQaId(null);
      else setPlayingArticleNum(null);
    }
  };

  const playTTS = (text: string, articleNum: number) => {
    playClientTTS(text, false, articleNum);
  };

  const playQaTTS = (text: string, msgIndex: number) => {
    playClientTTS(text, true, msgIndex);
  };

  const startRecording = async () => {
    try {
      setErrorMsg('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      audioChunksRef.current = [];

      processor.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);
        audioChunksRef.current.push(new Float32Array(channelData));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      setIsRecording(true);
      setProcessingStatus('Дауыс жазылуда...');
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setErrorMsg('Микрофонға рұқсат берілмеген.');
    }
  };

  const stopRecordingAndTranscribe = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      setProcessingStatus('Сөзіңіз мәтінге айналдырылуда...');
      
      if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) await audioContextRef.current.close();

      const chunks = audioChunksRef.current;
      if (chunks.length === 0) {
        setIsProcessing(false);
        return;
      }

      const totalLength = chunks.reduce((acc, val) => acc + val.length, 0);
      const combined = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      const buffer = new ArrayBuffer(44 + combined.length * 2);
      const view = new DataView(buffer);
      
      const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
      };

      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + combined.length * 2, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, 16000, true);
      view.setUint32(28, 16000 * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(view, 36, 'data');
      view.setUint32(40, combined.length * 2, true);

      let pcmOffset = 44;
      for (let i = 0; i < combined.length; i++) {
        let s = Math.max(-1, Math.min(1, combined[i]));
        view.setInt16(pcmOffset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        pcmOffset += 2;
      }

      const blob = new Blob([view], { type: 'audio/wav' });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        try {
          if (!apiKey) {
            setErrorMsg('Gemini API кілті орнатылмаған');
            setIsProcessing(false);
            return;
          }
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          const result = await model.generateContent([
            'Транскрибируй это аудио в текст. Напиши только распознанный текст. Если аудио пустое или непонятное, напиши ровно одно слово: Ештеңе',
            { inlineData: { data: base64data, mimeType: 'audio/wav' } }
          ]);
          
          const text = result.response.text().trim();
          if (text && text.toLowerCase() !== 'ештеңе') {
            askGemini(text);
          } else {
            setErrorMsg('Дауыс анықталмады. Қайта көріңіз.');
            setIsProcessing(false);
          }
        } catch (err: any) {
          console.error('Transcription error:', err);
          setErrorMsg('Транскрипция қатесі: ' + err.message);
          setIsProcessing(false);
        }
      };
    } catch (err: any) {
      console.error('Recording stop error:', err);
      setErrorMsg('Жазуды тоқтату кезінде қате кетті');
      setIsProcessing(false);
    }
  };

  const askGemini = async (overrideText?: string) => {
    const textToAsk = overrideText || questionText;
    if (!textToAsk.trim()) return;

    const newChat = [...chatLog, { role: 'user' as const, text: textToAsk }];
    setChatLog(newChat);
    if (!overrideText) setQuestionText('');
    setErrorMsg('');
    
    setIsProcessing(true);
    setProcessingStatus('ИИ жауап іздеуде...');

    try {
      if (!apiKey) {
        setErrorMsg('Gemini API кілті орнатылмаған');
        setIsProcessing(false);
        return;
      }
      
      const fullContext = JSON.stringify(constitutionData);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `Ты помощник по Конституции РК. Отвечай ТОЛЬКО на основе текста ниже. Мәтін: ${fullContext}. Сұрақ: ${textToAsk}`;
      
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      setChatLog([...newChat, { role: 'ai', text: responseText }]);
      playQaTTS(responseText, newChat.length);
      
    } catch (err: any) {
      console.error('QA Error:', err);
      setErrorMsg('ИИ жауап беру қатесі: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full flex justify-center px-4 md:px-8 pb-16">
      <div className="w-full max-w-5xl space-y-12">
        
        {/* Header / Instructions */}
        <div 
          className="rounded-3xl p-8 md:p-10 border shadow-2xl backdrop-blur-xl flex flex-col items-center text-center"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(var(--accent-rgb), 0.15)', color: 'var(--accent)' }}>
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif" }}>
            Қазақстан Республикасының Конституциясы
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-lg md:text-xl max-w-2xl mx-auto">
            Баптарды тыңдаңыз немесе ИИ-көмекшісіне дауыспен сұрақ қойыңыз. Жасанды интеллект сізге нақты жауаптар береді.
          </p>
          {errorMsg && (
            <div className="mt-8 px-6 py-4 rounded-2xl flex items-center justify-center gap-3 border shadow-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
              <AlertCircle size={24} />
              <span className="font-medium text-lg">{errorMsg}</span>
            </div>
          )}
        </div>

        {/* AI Assistant Chat Block */}
        <div 
          className="rounded-3xl border overflow-hidden flex flex-col h-[600px] shadow-2xl backdrop-blur-xl relative"
          style={{ background: 'var(--card-bg)', borderColor: 'rgba(var(--accent-rgb), 0.3)' }}
        >
          <div 
            className="px-6 py-5 border-b flex items-center gap-4"
            style={{ background: 'rgba(var(--accent-rgb), 0.05)', borderColor: 'rgba(var(--accent-rgb), 0.15)' }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
              <Bot size={24} />
            </div>
            <div>
              <h2 className="font-bold text-xl tracking-wide" style={{ color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif" }}>
                ИИ-көмекші
              </h2>
              <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Онлайн • Сізге көмектесуге дайын</p>
            </div>
          </div>
          
          <div ref={chatContainerRef} className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6" style={{ background: 'rgba(0, 0, 0, 0.15)' }}>
            {chatLog.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border mt-auto shadow-sm" style={{ background: 'var(--card-bg)', borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                    <Bot size={20} />
                  </div>
                )}
                
                <div className={`max-w-[80%] p-5 rounded-3xl shadow-md border ${
                  msg.role === 'user' 
                    ? 'rounded-br-sm' 
                    : 'rounded-bl-sm'
                }`}
                style={msg.role === 'user' 
                  ? { background: 'rgba(var(--accent-rgb), 0.15)', border: '1px solid rgba(var(--accent-rgb), 0.4)', color: 'var(--text-primary)' }
                  : { background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }
                }>
                  <p className="text-lg leading-relaxed">{msg.text}</p>
                  
                  {msg.role === 'ai' && (
                    <button 
                      onClick={() => playQaTTS(msg.text, idx)}
                      className="mt-4 px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-all font-semibold border shadow-sm"
                      style={
                        playingQaId === idx
                          ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: 'var(--bg-primary)' }
                          : { background: 'var(--bg-secondary)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }
                      }
                      onMouseEnter={(e) => { if(playingQaId !== idx) { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; } }}
                      onMouseLeave={(e) => { if(playingQaId !== idx) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--card-border)'; } }}
                    >
                      {playingQaId === idx ? <Pause size={16} /> : <Play size={16} />}
                      {playingQaId === idx ? 'Тоқтату' : 'Тыңдау'}
                    </button>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border mt-auto shadow-sm" style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: 'var(--bg-primary)' }}>
                    <User size={20} />
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex gap-4 w-full justify-start items-end animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm" style={{ background: 'var(--card-bg)', borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                  <Bot size={20} />
                </div>
                <div className="p-4 rounded-3xl rounded-bl-sm shadow-md border flex items-center gap-3" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
                  <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
                  <span className="font-medium text-base">{processingStatus}</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t shadow-inner relative z-10" style={{ borderColor: 'var(--card-border)', background: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-4 max-w-4xl mx-auto">
              <button
                onClick={() => {
                  if (isRecording) stopRecordingAndTranscribe();
                  else startRecording();
                }}
                disabled={isProcessing && !isRecording}
                className={`w-16 h-16 rounded-full transition-all duration-300 shrink-0 flex items-center justify-center shadow-lg ${
                  isRecording 
                    ? 'animate-pulse scale-110' 
                    : 'hover:scale-105'
                }`}
                style={isRecording 
                  ? { background: 'rgba(239, 68, 68, 0.9)', color: '#fff', boxShadow: '0 0 25px rgba(239, 68, 68, 0.5)' }
                  : { background: 'var(--card-bg)', color: 'var(--accent)', border: '2px solid rgba(var(--accent-rgb), 0.3)' }
                }
              >
                {isRecording ? <Mic size={28} /> : <MicOff size={28} />}
              </button>
              
              <input 
                type="text" 
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askGemini()}
                placeholder={isRecording ? "Сөйлеп жатырсыз..." : "Сұрағыңызды жазыңыз..."}
                disabled={isProcessing || isRecording}
                className="flex-1 px-6 py-5 rounded-full focus:outline-none transition-all text-lg shadow-inner disabled:opacity-50"
                style={{ 
                  background: 'var(--card-bg)', 
                  border: '2px solid var(--card-border)', 
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--card-border)'}
              />
              
              <button 
                onClick={() => askGemini()}
                disabled={isProcessing || isRecording || !questionText.trim()}
                className="w-16 h-16 rounded-full transition-all shadow-lg shrink-0 flex items-center justify-center hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                <Send size={26} className="translate-x-1" />
              </button>
            </div>
            <p className="text-sm text-center mt-4 font-medium" style={{ color: 'var(--text-muted)' }}>
              {isRecording ? <span style={{ color: '#ef4444' }}>🔴 Жазу үшін сөйлеңіз, аяқтау үшін қайта басыңыз</span> : "Сөйлеу үшін микрофонды басыңыз, аяқтаған соң қайта басыңыз"}
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="py-8 flex items-center justify-center opacity-60">
          <div className="h-[2px] w-full max-w-[200px]" style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }} />
          <h2 className="mx-6 text-xl font-bold uppercase tracking-widest text-center" style={{ color: 'var(--text-secondary)' }}>
            Конституция Баптары
          </h2>
          <div className="h-[2px] w-full max-w-[200px]" style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }} />
        </div>

        {/* Content Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-80 shrink-0 space-y-4">
            <div className="sticky top-8 rounded-3xl p-6 border shadow-xl backdrop-blur-md" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <h3 className="font-bold text-2xl mb-6 tracking-wide uppercase flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                <BookOpen size={24} style={{ color: 'var(--accent)' }} /> Мазмұны
              </h3>
              <div className="space-y-3">
                {constitutionData.sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSectionId(section.id)}
                    className="w-full text-left px-5 py-4 rounded-2xl transition-all duration-300 border font-medium text-base leading-snug flex items-center justify-between group"
                    style={
                      selectedSectionId === section.id
                        ? { background: 'rgba(var(--accent-rgb), 0.15)', borderColor: 'var(--accent)', color: 'var(--text-primary)' }
                        : { background: 'transparent', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }
                    }
                    onMouseEnter={(e) => { if(selectedSectionId !== section.id) e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb), 0.5)'; }}
                    onMouseLeave={(e) => { if(selectedSectionId !== section.id) e.currentTarget.style.borderColor = 'var(--card-border)'; }}
                  >
                    <span className="group-hover:translate-x-1 transition-transform">{section.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="flex-1 space-y-6">
            <div className="rounded-3xl p-6 border shadow-2xl backdrop-blur-md" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <h3 className="text-xl md:text-2xl font-bold mb-6 pb-4 border-b" style={{ color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif", borderColor: 'var(--card-border)' }}>
                {selectedSection.title}
              </h3>
              <div className="space-y-4">
                {selectedSection.articles.map(article => (
                  <div key={article.number} className="p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg relative overflow-hidden group" 
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--card-border)' }}>
                    
                    {/* Subtle decorative number */}
                    <div className="absolute -top-4 -right-2 text-[80px] font-black opacity-5 pointer-events-none select-none transition-transform group-hover:scale-110" style={{ color: 'var(--text-primary)' }}>
                      {article.number}
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-4 mb-3">
                      <h4 className="font-bold text-base md:text-lg" style={{ color: 'var(--accent)' }}>{article.number}-бап</h4>
                      <button
                        onClick={() => playTTS(article.text, article.number)}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm w-full md:w-auto"
                        style={
                          playingArticleNum === article.number
                            ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: 'var(--bg-primary)' }
                            : { background: 'var(--card-bg)', borderColor: 'rgba(var(--accent-rgb), 0.3)', color: 'var(--text-primary)' }
                        }
                        onMouseEnter={(e) => { if(playingArticleNum !== article.number) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(var(--accent-rgb), 0.2)'; } }}
                        onMouseLeave={(e) => { if(playingArticleNum !== article.number) { e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb), 0.3)'; e.currentTarget.style.boxShadow = 'none'; } }}
                      >
                        {playingArticleNum === article.number ? <Pause size={14} /> : <Play size={14} />}
                        {playingArticleNum === article.number ? 'Тоқтату' : 'Тыңдау'}
                      </button>
                    </div>
                    <p className="leading-relaxed text-sm md:text-base relative z-10" style={{ color: 'var(--text-secondary)' }}>
                      {article.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
