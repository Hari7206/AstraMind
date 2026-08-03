// hooks/useMessageHandling.js
import { useState, useRef, useEffect } from "react";

export function useMessageHandling() {
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);
  const [speechState, setSpeechState] = useState({ index: null, status: "stopped" });

  const recognitionRef = useRef(null);
  const baseMessageRef = useRef("");
  const fileInputRef = useRef(null);
  const plusMenuRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          baseMessageRef.current += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setMessage(baseMessageRef.current + interimTranscript);
    };

    recognition.onerror = () => stopListening();
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target)) {
        setIsPlusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    baseMessageRef.current = message ? message + " " : "";
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const handleCancelSpeech = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
    setMessage(baseMessageRef.current.trim());
  };

  const handleAcceptSpeech = () => stopListening();

  const handleCopyText = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageIndex(index);
    setTimeout(() => setCopiedMessageIndex(null), 2000);
  };

  const handleToggleSpeech = (text, index) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    if (speechState.index === index) {
      if (speechState.status === "playing") {
        synth.pause();
        setSpeechState({ index, status: "paused" });
      } else if (speechState.status === "paused") {
        synth.resume();
        setSpeechState({ index, status: "playing" });
      } else {
        startSpeaking(text, index, synth);
      }
    } else {
      synth.cancel();
      startSpeaking(text, index, synth);
    }
  };

  const startSpeaking = (text, index, synth) => {
    const cleanText = text.replace(/\[.*?\]\(.*?\)/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);

    const voices = synth.getVoices();
    const femaleVoice = voices.find(
      (v) =>
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("google uk english female") ||
        v.name.toLowerCase().includes("natural")
    );
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onend = () => setSpeechState({ index: null, status: "stopped" });
    utterance.onerror = () => setSpeechState({ index: null, status: "stopped" });

    setSpeechState({ index, status: "playing" });
    synth.speak(utterance);
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setIsPlusMenuOpen(false);
    if (mode === 'upload') {
      fileInputRef.current?.click();
    }
  };

  const handleFileUpload = async (event, onUpload) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ["pdf", "docx", "txt"];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      alert("Please upload PDF, DOCX, or TXT files only");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      await onUpload(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error("Upload error:", error);
      alert(`Upload failed: ${error.message}`);
      setIsUploading(false);
      setUploadProgress(0);
    }

    setSelectedMode(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return {
   
    message,
    setMessage,
    isListening,
    selectedMode,
    setSelectedMode,
    isPlusMenuOpen,
    setIsPlusMenuOpen,
    isUploading,
    uploadProgress,
    copiedMessageIndex,
    speechState,
    fileInputRef,
    plusMenuRef,
    
    startListening,
    handleCancelSpeech,
    handleAcceptSpeech,
    handleCopyText,
    handleToggleSpeech,
    handleModeSelect,
    handleFileUpload,
  };
}