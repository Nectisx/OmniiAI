'use client';

import { useRef, useState, KeyboardEvent } from 'react';
import { Send, Paperclip, Mic, MicOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/stores/chat.store';
import { uploadApi } from '@/services/api.service';
import { cn, formatFileSize } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useT } from '@/lib/i18n';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const t = useT();
  const [value, setValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { attachedFiles, addAttachedFile, removeAttachedFile } = useChatStore();
  const { toast } = useToast();

  const canSend = (value.trim().length > 0 || attachedFiles.length > 0) && !disabled && !isUploading;

  const handleSend = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // RG15: 10MB max
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Fichier trop volumineux. Taille maximum : 10 Mo.', variant: 'destructive' });
      return;
    }

    // RG18: formats supportés
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/png', 'image/jpeg'];
    if (!allowed.includes(file.type)) {
      toast({ title: 'Formats acceptés : PDF, Word, TXT, PNG, JPG.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadApi.uploadFile(file);
      addAttachedFile({
        name: file.name,
        type: file.type,
        size: file.size,
        base64: result.base64,
        extractedText: result.extractedText,
        isImage: result.isImage,
        serverFileName: result.fileName,
      });
      toast({ title: `Fichier "${file.name}" joint avec succès` });
    } catch (error) {
      toast({ title: 'Erreur lors de l\'upload', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const recognitionRef = useRef<any>(null);

  const handleMicClick = async () => {
    // Si déjà actif → on stoppe
    if (micActive && recognitionRef.current) {
      recognitionRef.current.stop();
      setMicActive(false);
      return;
    }

    // Vérif support navigateur
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: 'Dictée vocale non supportée',
        description: 'Utilisez Chrome, Edge ou Safari récent',
        variant: 'destructive',
      });
      return;
    }

    // Vérif HTTPS (Web Speech API exige un contexte sécurisé)
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      toast({
        title: 'HTTPS requis',
        description: 'La dictée vocale nécessite une connexion sécurisée (HTTPS).',
        variant: 'destructive',
      });
      return;
    }

    // Demander explicitement la permission micro
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast({
        title: 'Microphone refusé',
        description: 'Autorisez l\'accès au micro dans les paramètres du navigateur.',
        variant: 'destructive',
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = '';

    recognition.onstart = () => {
      setMicActive(true);
      toast({ title: '🎤 Écoute en cours...', description: 'Parlez maintenant. Cliquez à nouveau pour stopper.' });
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      setValue((prev) => {
        // Garde le texte tapé avant + ajoute la transcription
        const base = prev.replace(/\s*<<interim>>.*$/, '').trim();
        const result = finalTranscript ? (base ? base + ' ' : '') + finalTranscript.trim() : base;
        return interim ? `${result}${result ? ' ' : ''}${interim}` : result;
      });
    };

    recognition.onend = () => {
      setMicActive(false);
      recognitionRef.current = null;
      // Cleanup final : retire les marqueurs interim s'il en reste
      setValue((prev) => prev.replace(/\s*<<interim>>.*$/, '').trim());
    };

    recognition.onerror = (event: any) => {
      setMicActive(false);
      recognitionRef.current = null;
      const errorMessages: Record<string, string> = {
        'not-allowed': 'Permission micro refusée',
        'no-speech': 'Aucune parole détectée',
        'audio-capture': 'Pas de micro détecté',
        'network': 'Erreur réseau',
      };
      toast({
        title: errorMessages[event.error] || 'Erreur de reconnaissance vocale',
        description: event.error,
        variant: 'destructive',
      });
    };

    recognition.start();
  };

  const charCount = value.length;
  const charColor = charCount > 45000 ? 'text-red-400' : charCount > 40000 ? 'text-yellow-400' : 'text-[var(--text3)]';

  return (
    <div className="p-3">
      <div
        className={cn(
          'rounded-[14px] border transition-colors',
          'bg-[var(--bg3)]',
          disabled ? 'border-[var(--border)] opacity-60' : 'border-[var(--border2)] focus-within:border-[var(--cyan)]',
        )}
      >
        {/* File previews */}
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div
              className="flex flex-wrap gap-1.5 px-3 pt-2.5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {attachedFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg4)] border border-[var(--border)] text-[11px] text-[var(--text2)]"
                >
                  <span>{file.isImage ? '🖼' : '📄'}</span>
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <span className="text-[var(--text3)]">({formatFileSize(file.size)})</span>
                  <button
                    onClick={() => removeAttachedFile(i)}
                    className="text-[var(--text3)] hover:text-[var(--danger)] ml-0.5"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Textarea */}
        <div className="flex items-end gap-2 px-3 pt-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            disabled={disabled}
            rows={1}
            maxLength={50000}
            className={cn(
              'flex-1 bg-transparent border-none outline-none resize-none',
              'text-[13px] text-[var(--text)] placeholder:text-[var(--text3)]',
              'leading-relaxed min-h-[36px] max-h-[120px] py-1',
            )}
            style={{ scrollbarWidth: 'none' }}
          />
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={cn(
                'p-1.5 rounded-lg transition-colors text-[var(--text3)]',
                'hover:bg-[var(--bg4)] hover:text-[var(--text)]',
                isUploading && 'opacity-50',
              )}
              title="Joindre un fichier (PDF, DOCX, TXT, PNG, JPG — max 10 Mo)"
            >
              <Paperclip size={15} />
            </button>
            <button
              onClick={handleMicClick}
              className={cn(
                'relative p-1.5 rounded-lg transition-colors',
                micActive
                  ? 'text-red-400 bg-red-500/15 animate-pulse'
                  : 'text-[var(--text3)] hover:bg-[var(--bg4)] hover:text-[var(--text)]',
              )}
              title={micActive ? 'Stopper la dictée' : 'Démarrer la dictée vocale'}
            >
              {micActive ? <MicOff size={15} /> : <Mic size={15} />}
              {micActive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className={cn('text-[11px]', charColor)}>
              {charCount.toLocaleString()} / 50 000
            </span>
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all',
                canSend
                  ? 'bg-[var(--cyan)] text-[#0a1520] hover:bg-[var(--cyan2)]'
                  : 'bg-[var(--bg4)] text-[var(--text3)] cursor-not-allowed',
              )}
            >
              <Send size={13} />
              {t('chat.send')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
