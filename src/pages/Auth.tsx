import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { handleError, handleSuccess } from '@/lib/error-handler';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Store, Eye, EyeOff, Shield, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";

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
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasExistingAdmin, setHasExistingAdmin] = useState<boolean | null>(null);
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [firstAccessStep, setFirstAccessStep] = useState<'email' | 'password'>('email');
  const [firstAccessEmail, setFirstAccessEmail] = useState('');

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        onLoginSuccess();
        return;
      }
    };
    checkAuth();
  }, [onLoginSuccess]);

  // Handle email confirmation and password recovery links
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      logger.debug('Auth URL hash detected', { hash });
      
      if (hash.includes('type=recovery')) {
        setIsReset(true);
        setIsLogin(true);
        toast({
          title: "Redefinição de senha",
          description: "Defina sua nova senha abaixo"
        });
      } else if (hash.includes('type=signup')) {
        setIsConfirming(true);
        toast({
          title: "Email confirmado!",
          description: "Sua conta foi confirmada. Você já pode fazer login."
        });
        // Clear the hash and redirect to clean URL
        setTimeout(() => {
          window.location.hash = '';
          setIsConfirming(false);
          setIsLogin(true);
        }, 2000);
      }
    }
  }, []);

  const removeSupabaseAuthKeys = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-')) keysToRemove.push(key);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  };

  const handleFirstAccess = async () => {
    if (!firstAccessEmail) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe seu email",
        variant: "destructive",
      });
      return;
    }

    setIsBootstrapping(true);
    
    try {
      logger.info('Calling first-access function - step 1', { email: firstAccessEmail });
      
      const { data, error } = await supabase.functions.invoke('first-access', {
        body: {
          email: firstAccessEmail,
          step: 'check_email'
        },
      });

      if (error) {
        logger.error('First access function error', { error });
        throw new Error(error.message || 'Erro ao verificar email');
      }

      logger.info('First access step 1 success', { data });

      if (data.can_set_password) {
        toast({
          title: "Email válido!",
          description: "Agora defina sua senha de acesso",
        });
        setFirstAccessStep('password');
      }
      
    } catch (error: any) {
      logger.error('First access error', { error });
      toast({
        title: "Erro no primeiro acesso",
        description: error.message || "Email não encontrado no sistema",
        variant: "destructive",
      });
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleSetFirstPassword = async () => {
    if (!password || !confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha a senha e confirmação",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    setIsBootstrapping(true);
    
    try {
      logger.info('Calling first-access function - step 2', { email: firstAccessEmail });
      
      const { data, error } = await supabase.functions.invoke('first-access', {
        body: {
          email: firstAccessEmail,
          password: password,
          step: 'set_password'
        },
      });

      if (error) {
        logger.error('First access set password error', { error });
        throw new Error(error.message || 'Erro ao definir senha');
      }

      logger.info('First access password set success', { data });

      toast({
        title: "Senha definida!",
        description: "Fazendo login automaticamente...",
      });

      // Automatically sign in the user after successful password set
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: firstAccessEmail,
        password,
      });

      if (signInError) {
        logger.error('Auto sign-in error', { error: signInError });
        toast({
          title: "Senha definida com sucesso!",
          description: "Por favor, faça login normalmente",
        });
        setIsFirstAccess(false);
        setFirstAccessStep('email');
        setFirstAccessEmail('');
        setEmail(firstAccessEmail);
        setPassword('');
        setConfirmPassword('');
      } else {
        toast({
          title: "Sucesso!",
          description: "Senha definida e login realizado",
        });
        onLoginSuccess();
      }
      
    } catch (error: any) {
      logger.error('Set password error', { error });
      toast({
        title: "Erro ao definir senha",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsBootstrapping(false);
    }
  };

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
          logger.error('Login error', { error });
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Erro de Login",
              description: "Email ou senha incorretos. Se você criou uma conta recentemente, verifique se confirmou seu email.",
              variant: "destructive"
            });
          } else if (error.message.includes('Email not confirmed')) {
            toast({
              title: "Email não confirmado",
              description: "Verifique sua caixa de entrada e confirme seu email antes de fazer login.",
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
        if (!rememberMe) {
          removeSupabaseAuthKeys();
          try { sessionStorage.setItem('ephemeral_session', '1'); } catch {}
        }
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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      const errorConfig = handleError(new Error('Informe seu email.'), {
        toastTitle: 'Erro',
        source: 'auth-forgot'
      });
      if (errorConfig) toast(errorConfig);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`
      });
      if (error) throw error;
      toast({ title: "Verifique seu email", description: "Enviamos um link para redefinir sua senha." });
      setIsForgot(false);
    } catch (err: any) {
      const errorConfig = handleError(err, {
        toastTitle: 'Erro',
        toastDescription: 'Não foi possível enviar o email.',
        source: 'auth-forgot'
      });
      if (errorConfig) toast(errorConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      const errorConfig = handleError(new Error('A nova senha deve ter pelo menos 6 caracteres.'), {
        toastTitle: 'Senha fraca',
        source: 'auth-reset'
      });
      if (errorConfig) toast(errorConfig);
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      const errorConfig = handleError(new Error('As senhas não coincidem.'), {
        toastTitle: 'Erro',
        source: 'auth-reset'
      });
      if (errorConfig) toast(errorConfig);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Senha redefinida", description: "Você já pode fazer login com a nova senha." });
      setIsReset(false);
      setIsLogin(true);
    } catch (err: any) {
      const errorConfig = handleError(err, {
        toastTitle: 'Erro',
        toastDescription: 'Não foi possível redefinir a senha.',
        source: 'auth-reset'
      });
      if (errorConfig) toast(errorConfig);
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
            {isConfirming
              ? "Email confirmado com sucesso!"
              : isReset
              ? "Defina sua nova senha"
              : isForgot
              ? "Informe seu email para recuperar a senha"
              : isFirstAccess
              ? firstAccessStep === 'email' 
                ? "Informe seu email para definir sua senha"
                : "Defina sua senha de acesso"
              : isLogin
              ? "Faça login para continuar"
              : "Crie sua conta"}
          </p>
        </div>

        {/* RESET DE SENHA */}
        {isReset ? (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPasswordConfirm">Confirmar nova senha</Label>
              <Input
                id="newPasswordConfirm"
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder="Confirme a nova senha"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processando..." : "Redefinir senha"}
            </Button>
            <div className="text-center">
              <Button type="button" variant="link" className="text-sm" onClick={() => setIsReset(false)}>
                Voltar ao login
              </Button>
            </div>
          </form>
        ) : isForgot ? (
          /* ESQUECEU A SENHA */
          <form onSubmit={handleForgotSubmit} className="space-y-4">
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de redefinição"}
            </Button>
            <div className="text-center">
              <Button type="button" variant="link" className="text-sm" onClick={() => setIsForgot(false)}>
                Voltar ao login
              </Button>
            </div>
          </form>
        ) : isFirstAccess ? (
          /* PRIMEIRO ACESSO */
          <>
            {firstAccessStep === 'email' ? (
              <form onSubmit={(e) => { e.preventDefault(); handleFirstAccess(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstAccessEmail">Email</Label>
                  <Input
                    id="firstAccessEmail"
                    type="email"
                    value={firstAccessEmail}
                    onChange={(e) => setFirstAccessEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isBootstrapping}>
                  {isBootstrapping ? "Verificando..." : "Continuar"}
                </Button>
                <div className="text-center">
                  <Button 
                    type="button" 
                    variant="link" 
                    className="text-sm" 
                    onClick={() => {
                      setIsFirstAccess(false);
                      setFirstAccessStep('email');
                      setFirstAccessEmail('');
                    }}
                  >
                    Voltar ao login
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSetFirstPassword(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstPassword">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="firstPassword"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Sua nova senha"
                      required
                      minLength={8}
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
                
                <div className="space-y-2">
                  <Label htmlFor="confirmFirstPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmFirstPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua nova senha"
                    required
                    minLength={8}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isBootstrapping}>
                  {isBootstrapping ? "Definindo senha..." : "Definir Senha"}
                </Button>
                
                <div className="text-center">
                  <Button 
                    type="button" 
                    variant="link" 
                    className="text-sm" 
                    onClick={() => {
                      setFirstAccessStep('email');
                      setPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    Voltar
                  </Button>
                </div>
              </form>
            )}
          </>
        ) : (
          /* LOGIN / CADASTRO */
          <>
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

              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={rememberMe} onCheckedChange={(v) => setRememberMe(!!v)} />
                    Manter conectado
                  </label>
                  <Button type="button" variant="link" className="text-sm" onClick={() => setIsForgot(true)}>
                    Esqueceu a senha?
                  </Button>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processando..." : (isLogin ? "Entrar" : "Criar Conta")}
              </Button>

              {/* First Access Button - Always show on login */}
              {isLogin && !isFirstAccess && (
                <div className="pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full border-primary/50 hover:bg-primary/10" 
                    onClick={() => setIsFirstAccess(true)}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Primeiro Acesso
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Se você foi cadastrado pelo administrador, clique aqui para definir sua senha
                  </p>
                </div>
              )}
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
          </>
        )}
      </Card>
    </div>
  );
}