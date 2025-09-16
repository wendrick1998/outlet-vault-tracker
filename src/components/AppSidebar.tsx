import { 
  Home, 
  Search, 
  Package, 
  Clock, 
  List, 
  BarChart3, 
  Settings, 
  Users, 
  Bot, 
  Mic, 
  Bell,
  Brain,
  ChevronRight,
  Store,
  CheckSquare,
  TrendingUp,
  Activity,
  User
} from "lucide-react";

import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlag } from "@/lib/features";
import { FEATURE_FLAGS } from "@/lib/features";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function AppSidebar({ onNavigate, currentPage }: AppSidebarProps) {
  const { user } = useAuth();
  const { state } = useSidebar();
  const isAdmin = user?.role === 'admin';
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';
  
  // Feature flags
  const isAdminCadastrosEnabled = useFeatureFlag(FEATURE_FLAGS.ADMIN_CADASTROS);
  const isBatchOperationsEnabled = useFeatureFlag(FEATURE_FLAGS.BATCH_OPERATIONS);
  const isAdvancedReportingEnabled = useFeatureFlag(FEATURE_FLAGS.ADVANCED_REPORTING);

  const isActive = (page: string) => currentPage === page;

  const dashboardItems = [
    { 
      title: "Dashboard Principal", 
      page: "home", 
      icon: Home, 
      available: true 
    },
  ];

  const inventoryItems = [
    { 
      title: "Buscar & Operar", 
      page: "search-and-operate", 
      icon: Search, 
      available: true // Protegido pelo PermissionGuard do componente 
    },
    { 
      title: "Conferência de Inventário", 
      page: "conference", 
      icon: CheckSquare, 
      available: true 
    },
    { 
      title: "Histórico Conferências", 
      page: "historical-audits", 
      icon: TrendingUp, 
      available: true 
    },
    { 
      title: "Monitoramento", 
      page: "system-monitoring", 
      icon: Activity, 
      available: true 
    },
    { 
      title: "Itens Fora Agora", 
      page: "active-loans", 
      icon: Clock, 
      available: true 
    },
  ];

  const stockItems = [
    { 
      title: "Gestão de Estoque", 
      page: "stock", 
      icon: Store, 
      available: true 
    },
  ];

  const reportsItems = [
    { 
      title: "Histórico", 
      page: "history", 
      icon: List, 
      available: true 
    },
    { 
      title: "Analytics Avançados", 
      page: "analytics", 
      icon: BarChart3, 
      available: true // Sempre disponível agora
    },
  ];

  const adminItems = [
    { 
      title: "Perfil", 
      page: "profile", 
      icon: User, 
      available: true 
    },
    { 
      title: "Configurações", 
      page: "settings", 
      icon: Settings, 
      available: true 
    },
    { 
      title: "Gerenciar Cadastros", 
      page: "admin", 
      icon: Users, 
      available: isAdminCadastrosEnabled && isAdmin 
    },
  ];

  const aiItems = [
    { 
      title: "Assistente IA", 
      page: "ai-assistant", 
      icon: Bot, 
      available: true 
    },
    { 
      title: "Comandos de Voz", 
      page: "voice-commands", 
      icon: Mic, 
      available: true 
    },
    { 
      title: "Notificações IA", 
      page: "smart-notifications", 
      icon: Bell, 
      available: true 
    },
    { 
      title: "Previsões IA", 
      page: "predictions", 
      icon: Brain, 
      available: true 
    },
  ];

  const renderMenuItems = (items: typeof dashboardItems) => {
    return items
      .filter(item => item.available)
      .map((item) => (
        <SidebarMenuItem key={item.page}>
          <SidebarMenuButton 
            asChild
            isActive={isActive(item.page)}
            className="cursor-pointer"
          >
            <div 
              onClick={() => onNavigate(item.page)}
              className="flex items-center gap-2 w-full"
            >
              <item.icon className="h-4 w-4" />
              {state !== "collapsed" && <span>{item.title}</span>}
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ));
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <img 
            src="/cofre-tracker-logo.svg" 
            alt="Cofre Tracker" 
            className="h-6 w-6"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="h-6 w-6 bg-primary/10 rounded-md flex items-center justify-center hidden">
            <Store className="h-4 w-4 text-primary" />
          </div>
          {state !== "collapsed" && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Cofre Tracker</span>
              <span className="text-xs text-muted-foreground">Sistema de Inventário</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            {state !== "collapsed" && "Dashboard"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItems(dashboardItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Inventário */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {state !== "collapsed" && "Inventário"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItems(inventoryItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Estoque */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            {state !== "collapsed" && "Estoque"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItems(stockItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Relatórios */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {state !== "collapsed" && "Relatórios"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItems(reportsItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* IA & Automação */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            {state !== "collapsed" && "IA & Automação"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItems(aiItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administração - Only for managers and admins */}
        {isManagerOrAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {state !== "collapsed" && "Administração"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderMenuItems(adminItems)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}