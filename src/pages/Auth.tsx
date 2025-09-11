import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Store, Eye, EyeOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface AuthProps {
  onLoginSuccess: () => void;
}

export const Auth = ({ onLoginSuccess }: AuthProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        onLoginSuccess();
      }
    };
    checkAuth();
  }, [onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      toast({
        title: "Erro", 
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Erro de Login",
              description: "Email ou senha incorretos",
              variant: "destructive"
            });
          } else {
            throw error;
          }
          return;
        }

        toast({
          title: "Sucesso",
          description: "Login realizado com sucesso!"
        });
        onLoginSuccess();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: "Erro",
              description: "Este email já está registrado. Tente fazer login.",
              variant: "destructive"
            });
          } else {
            throw error;
          }
          return;
        }

        toast({
          title: "Sucesso",
          description: "Conta criada com sucesso! Verifique seu email para confirmar."
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary text-primary-foreground p-3 rounded-full">
              <Store className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Outlet Store Plus</h1>
          <p className="text-muted-foreground">
            {isLogin ? "Faça login para continuar" : "Crie sua conta"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua senha"
                required
                minLength={6}
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processando..." : (isLogin ? "Entrar" : "Criar Conta")}
          </Button>
        </form>

        <div className="text-center">
          <Button
            type="button"
            variant="link"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm"
          >
            {isLogin ? "Não tem uma conta? Criar conta" : "Já tem uma conta? Fazer login"}
          </Button>
        </div>
      </Card>
    </div>
  );
};