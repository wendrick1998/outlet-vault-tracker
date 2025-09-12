import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Mic, MicOff, Volume2, Brain } from 'lucide-react';

interface VoiceCommandsProps {
  onCommand?: (command: string, data?: any) => void;
  isVisible?: boolean;
  onToggle?: () => void;
}

interface VoiceCommand {
  command: string;
  action: string;
  confidence: number;
  timestamp: Date;
}

export function VoiceCommands({ onCommand, isVisible = false, onToggle }: VoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);

        if (finalTranscript) {
          processVoiceCommand(finalTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Erro no reconhecimento de voz",
          description: "Tente novamente",
          variant: "destructive",
        });
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const processVoiceCommand = async (voiceText: string) => {
    if (!user) return;

    setIsProcessing(true);
    try {
      // Send voice command to AI for processing
      const { data, error } = await supabase.functions.invoke('ai-chatbot', {
        body: {
          message: `COMANDO DE VOZ: ${voiceText}. Identifique se é um comando do sistema (buscar item, registrar saída, ver histórico, etc.) e execute a ação apropriada. Se for um comando, responda com JSON: {"isCommand": true, "action": "nome_da_acao", "data": {...}}. Se não for comando, responda normalmente.`,
          context: [{ role: 'system', content: 'Você é um assistente de comandos de voz para o sistema Cofre Tracker.' }],
          userId: user.id
        }
      });

      if (error) throw error;

      const response = data.response;
      
      // Try to parse as JSON command
      try {
        const commandData = JSON.parse(response);
        if (commandData.isCommand) {
          const command: VoiceCommand = {
            command: voiceText,
            action: commandData.action,
            confidence: 0.9,
            timestamp: new Date()
          };
          
          setLastCommand(command);
          onCommand?.(commandData.action, commandData.data);
          
          toast({
            title: "🎙️ Comando executado",
            description: `Ação: ${commandData.action}`,
          });

          // Text-to-speech response
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`Comando executado: ${commandData.action}`);
            utterance.lang = 'pt-BR';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
          }
        } else {
          // Not a command, just show AI response
          toast({
            title: "💬 Resposta da IA",
            description: response.slice(0, 100) + (response.length > 100 ? '...' : ''),
          });
        }
      } catch {
        // Not JSON, treat as regular response
        toast({
          title: "💬 Resposta da IA",
          description: response.slice(0, 100) + (response.length > 100 ? '...' : ''),
        });
      }

    } catch (error) {
      console.error('Error processing voice command:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar o comando de voz",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <Card className="p-4 bg-muted/20">
        <p className="text-sm text-muted-foreground text-center">
          Comandos de voz não suportados neste navegador
        </p>
      </Card>
    );
  }

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        size="sm"
        variant="outline"
        className="fixed bottom-20 right-4 rounded-full w-12 h-12 p-0 shadow-lg"
      >
        <Mic className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-20 right-4 w-80 shadow-xl border-primary/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Comandos de Voz</h3>
          </div>
          <Button size="sm" variant="ghost" onClick={onToggle}>
            ×
          </Button>
        </div>

        {/* Voice Status */}
        <div className="text-center space-y-3">
          <Button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`w-20 h-20 rounded-full ${
              isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {isListening ? (
              <MicOff className="h-8 w-8 text-white" />
            ) : (
              <Mic className="h-8 w-8 text-white" />
            )}
          </Button>
          
          <div className="space-y-1">
            <Badge variant={isListening ? "destructive" : isProcessing ? "default" : "secondary"}>
              {isListening ? "🎙️ Ouvindo..." : isProcessing ? "🤖 Processando..." : "💤 Parado"}
            </Badge>
            
            {transcript && (
              <p className="text-xs text-muted-foreground bg-secondary p-2 rounded">
                "{transcript}"
              </p>
            )}
          </div>
        </div>

        {/* Last Command */}
        {lastCommand && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Último comando:
            </h4>
            <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
              <p className="font-medium">"{lastCommand.command}"</p>
              <p className="text-green-700">Ação: {lastCommand.action}</p>
              <p className="text-xs text-muted-foreground">
                {lastCommand.timestamp.toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </div>
        )}

        {/* Voice Commands Help */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Comandos disponíveis:</h4>
          <div className="text-xs space-y-1 text-muted-foreground">
            <p>• "Buscar item [IMEI]"</p>
            <p>• "Registrar saída"</p>
            <p>• "Ver histórico"</p>
            <p>• "Mostrar estatísticas"</p>
            <p>• "Listar empréstimos"</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}