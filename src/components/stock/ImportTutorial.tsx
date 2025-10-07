import { useState, useEffect } from 'react';
import { Download, Upload, Eye, CheckCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialStep {
  icon: React.ElementType;
  title: string;
  description: string;
}

const steps: TutorialStep[] = [
  {
    icon: Download,
    title: 'Baixe o modelo',
    description: 'Escolha entre modelo básico ou completo'
  },
  {
    icon: FileText,
    title: 'Preencha os dados',
    description: 'Complete com informações dos aparelhos'
  },
  {
    icon: Upload,
    title: 'Faça upload',
    description: 'Envie o arquivo CSV ou XLSX'
  },
  {
    icon: Eye,
    title: 'Revise o preview',
    description: 'Confira os dados detectados'
  },
  {
    icon: CheckCircle,
    title: 'Confirme',
    description: 'Finalize a importação'
  }
];

export const ImportTutorial = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        Como funciona
      </h3>
      
      <div className="grid grid-cols-5 gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === activeStep;
          const isPast = index < activeStep;
          
          return (
            <div
              key={index}
              className={cn(
                "relative flex flex-col items-center text-center transition-all duration-300",
                isActive && "scale-110"
              )}
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-6 left-[60%] w-full h-0.5 transition-all duration-500",
                    isPast || isActive ? "bg-primary" : "bg-muted"
                  )}
                  style={{
                    width: 'calc(100% - 20px)'
                  }}
                />
              )}

              {/* Icon Circle */}
              <div
                className={cn(
                  "relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/50" 
                    : isPast
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className={cn(
                  "transition-all duration-300",
                  isActive ? "h-6 w-6" : "h-5 w-5"
                )} />
                
                {/* Pulse animation for active step */}
                {isActive && (
                  <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping" />
                )}
              </div>

              {/* Step Info */}
              <div className="mt-3 space-y-1">
                <p className={cn(
                  "text-xs font-medium transition-colors duration-300",
                  isActive 
                    ? "text-foreground" 
                    : isPast 
                    ? "text-muted-foreground/70"
                    : "text-muted-foreground/50"
                )}>
                  {step.title}
                </p>
                <p className={cn(
                  "text-[10px] transition-all duration-300",
                  isActive 
                    ? "text-muted-foreground opacity-100" 
                    : "text-muted-foreground/50 opacity-0"
                )}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ 
            width: `${((activeStep + 1) / steps.length) * 100}%` 
          }}
        />
      </div>
    </div>
  );
};