// UI Inventory - Mapeamento completo de telas e componentes
export interface ComponentInfo {
  name: string;
  file: string;
  props: string[];
  variants: string[];
  states: string[];
  tokens: string[];
  examples: string[];
}

export interface ScreenInfo {
  name: string;
  route: string;
  component: string;
  description: string;
  subComponents: string[];
  states: string[];
  actions: string[];
  modals: string[];
  dependencies: string[];
}

export const SCREENS_INVENTORY: ScreenInfo[] = [
  {
    name: "Dashboard/Home",
    route: "/",
    component: "Home.tsx", 
    description: "Tela principal com estatísticas e ações rápidas",
    subComponents: ["ActionCard", "StatsCard", "AIAssistant", "SmartAnalytics"],
    states: ["loading", "loaded", "error"],
    actions: ["navegar", "expandir_ai", "ver_analytics"],
    modals: ["AIAssistant", "SmartAnalytics"],
    dependencies: ["useSystemStats", "useActiveLoans", "usePendingSales"]
  },
  {
    name: "Buscar & Operar",
    route: "/search-and-operate",
    component: "SearchAndOperate.tsx",
    description: "Busca unificada com operações individuais e em lote",
    subComponents: ["IMEISearch", "ItemCard", "OutflowForm", "BatchOperations"],
    states: ["search", "multiple-results", "item-details", "outflow-form", "batch-selection"],
    actions: ["buscar", "selecionar", "emprestar", "vender", "batch_operations"],
    modals: ["OutflowForm", "QuickCustomerForm", "NotesDialog"],
    dependencies: ["useInventory", "useLoans", "useCustomers"]
  },
  {
    name: "Empréstimos Ativos",
    route: "/active-loans", 
    component: "ActiveLoans.tsx",
    description: "Gestão de empréstimos em andamento",
    subComponents: ["LoanCard", "LoanTimer", "ReturnDialog"],
    states: ["loading", "empty", "loaded", "returning"],
    actions: ["devolver", "vender", "adicionar_nota", "filtrar"],
    modals: ["ReturnDialog", "SellDialog", "NotesDialog"],
    dependencies: ["useActiveLoans", "useReasons", "useSellers"]
  },
  {
    name: "Histórico",
    route: "/history",
    component: "History.tsx", 
    description: "Histórico completo de empréstimos e vendas",
    subComponents: ["FilterPanel", "HistoryTable", "HistoryCard"],
    states: ["loading", "empty", "loaded", "filtering"],
    actions: ["filtrar", "exportar", "ver_detalhes"],
    modals: ["DetailsDialog", "ExportDialog"],
    dependencies: ["useLoanHistory", "useReasons", "useSellers"]
  },
  {
    name: "Admin - Cadastros", 
    route: "/admin",
    component: "Admin.tsx",
    description: "Gestão de usuários, dispositivos e catálogos",
    subComponents: ["UserManagement", "DeviceModels", "BrandsManager", "TabsInterface"],
    states: ["loading", "loaded", "creating", "editing"],
    actions: ["criar_usuario", "editar_modelo", "gerenciar_marcas", "importar_dados"],
    modals: ["AddUserDialog", "AddDeviceDialog", "CatalogItemDialog"],
    dependencies: ["useUsersAdmin", "useDeviceModelsAdmin", "useCatalogs"]
  },
  {
    name: "Inventário/Conferência",
    route: "/conference", 
    component: "InventoryConferencePage.tsx",
    description: "Conferência de inventário por leitor de código",
    subComponents: ["ScanInterface", "AuditProgress", "ConferenceWizard"],
    states: ["setup", "scanning", "review", "completed"],
    actions: ["iniciar_scan", "confirmar_item", "resolver_pendencia", "finalizar"],
    modals: ["AuditSetup", "ScanFeedback", "TaskDialog"],
    dependencies: ["useInventoryAudit", "useInventory"]
  },
  {
    name: "Perfil",
    route: "/profile",
    component: "Profile.tsx",
    description: "Configurações de perfil do usuário", 
    subComponents: ["ProfileForm", "PasswordChange", "MFASetup"],
    states: ["viewing", "editing", "saving"],
    actions: ["editar", "alterar_senha", "configurar_mfa"],
    modals: ["ChangePasswordDialog", "MFASetup"],
    dependencies: ["useProfile", "useAuth"]
  },
  {
    name: "Configurações",
    route: "/settings", 
    component: "Settings.tsx",
    description: "Configurações gerais do sistema",
    subComponents: ["SettingsForm", "PreferenceToggles"],
    states: ["loading", "loaded", "saving"],
    actions: ["salvar_preferencias", "reset_configuracoes"],
    modals: [],
    dependencies: ["useProfile"]
  },
  {
    name: "Autenticação",
    route: "/auth",
    component: "Auth.tsx",
    description: "Tela de login e registro",
    subComponents: ["LoginForm", "PasswordStrength"],
    states: ["login", "loading", "error", "mfa_required"],
    actions: ["fazer_login", "esqueceu_senha", "verificar_mfa"],
    modals: ["ResetPasswordDialog", "MFADialog"],
    dependencies: ["useAuth"]
  }
];

export const COMPONENTS_INVENTORY: ComponentInfo[] = [
  {
    name: "Button",
    file: "components/ui/button.tsx",
    props: ["variant", "size", "disabled", "loading"],
    variants: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    states: ["idle", "hover", "focus", "active", "disabled", "loading"],
    tokens: ["--primary", "--primary-foreground", "--secondary", "--destructive"],
    examples: ["<Button>Primary</Button>", "<Button variant=\"outline\">Secondary</Button>"]
  },
  {
    name: "Card",
    file: "components/ui/card.tsx", 
    props: ["className", "children"],
    variants: ["default", "interactive"],
    states: ["static", "hover", "selected"],
    tokens: ["--card", "--card-foreground", "--border", "--shadow-soft"],
    examples: ["<Card><CardContent>Content</CardContent></Card>"]
  },
  {
    name: "ItemCard", 
    file: "components/ItemCard.tsx",
    props: ["item", "onSelect", "selected", "onAction"],
    variants: ["default", "compact", "detailed"],
    states: ["idle", "selected", "loading", "disabled"],
    tokens: ["--primary", "--muted", "--success", "--warning", "--destructive"],
    examples: ["<ItemCard item={inventoryItem} />"]
  },
  {
    name: "Badge",
    file: "components/ui/badge.tsx",
    props: ["variant", "className"],
    variants: ["default", "secondary", "destructive", "outline"],
    states: ["static"],
    tokens: ["--primary", "--secondary", "--destructive", "--muted"],
    examples: ["<Badge>Available</Badge>", "<Badge variant=\"destructive\">Sold</Badge>"]
  },
  {
    name: "Input",
    file: "components/ui/input.tsx",
    props: ["type", "placeholder", "disabled", "value", "onChange"],
    variants: ["default"],
    states: ["idle", "focus", "error", "disabled"],
    tokens: ["--input", "--border", "--ring", "--foreground"],
    examples: ["<Input placeholder=\"Buscar IMEI...\" />"]
  },
  {
    name: "StatsCard",
    file: "components/ui/stats-card.tsx", 
    props: ["title", "value", "subtitle", "icon", "variant"],
    variants: ["default", "primary", "success", "warning"],
    states: ["loading", "loaded", "error"],
    tokens: ["--card", "--primary", "--muted-foreground", "--success"],
    examples: ["<StatsCard title=\"Total\" value=\"83\" />"]
  },
  {
    name: "BatteryIndicator",
    file: "components/BatteryIndicator.tsx",
    props: ["percentage", "size", "showLabel"],
    variants: ["default", "compact"],
    states: ["critical", "low", "medium", "high", "full"],
    tokens: ["--destructive", "--warning", "--success"],
    examples: ["<BatteryIndicator percentage={97} />"]
  },
  {
    name: "Dialog",
    file: "components/ui/dialog.tsx",
    props: ["open", "onOpenChange", "children"],
    variants: ["default", "large", "fullscreen"],
    states: ["closed", "opening", "open", "closing"],
    tokens: ["--popover", "--popover-foreground", "--border", "--shadow-strong"],
    examples: ["<Dialog><DialogContent>Content</DialogContent></Dialog>"]
  },
  {
    name: "ActionCard",
    file: "components/ActionCard.tsx",
    props: ["title", "description", "icon", "onClick", "variant", "badge"],
    variants: ["default", "primary", "secondary"],
    states: ["idle", "hover", "loading", "disabled"],
    tokens: ["--card", "--primary", "--muted-foreground", "--warning"],
    examples: ["<ActionCard title=\"Buscar\" icon={Search} />"]
  },
  {
    name: "Loading",
    file: "components/ui/loading.tsx",
    props: ["size", "variant"],
    variants: ["default", "dots", "spinner"],
    states: ["spinning"],
    tokens: ["--primary", "--muted"],
    examples: ["<Loading />", "<Loading variant=\"dots\" />"]
  }
];

// Mapa de tokens por funcionalidade
export const TOKEN_MAPPING = {
  inventory_status: {
    available: "--success",
    loaned: "--warning", 
    sold: "--muted",
    maintenance: "--destructive"
  },
  battery_levels: {
    critical: "--destructive",
    low: "--warning",
    medium: "--warning",
    high: "--success",
    full: "--success"
  },
  loan_status: {
    active: "--primary",
    returned: "--success", 
    overdue: "--destructive",
    sold: "--muted"
  },
  user_roles: {
    admin: "--primary",
    manager: "--secondary",
    user: "--muted"
  }
};

// Guia rápido de alterações
export const QUICK_CHANGE_GUIDE = {
  "Mudar cor da marca": {
    token: "--primary",
    files: ["index.css", "tailwind.config.ts"],
    classes: ["bg-primary", "text-primary", "border-primary"],
    example: "Altere --primary: 210 100% 50% para nova cor HSL"
  },
  "Ajustar border radius global": {
    token: "--radius", 
    files: ["index.css"],
    classes: ["rounded-lg", "rounded-md", "rounded-sm"],
    example: "Altere --radius: 0.75rem para 0.5rem (mais quadrado)"
  },
  "Trocar tipografia": {
    token: "--font-family",
    files: ["tailwind.config.ts"],
    classes: ["font-sans"],
    example: "Configure fontFamily no Tailwind config"
  },
  "Cores de status de bateria": {
    token: "battery levels",
    files: ["BatteryIndicator.tsx"],
    classes: ["text-success", "text-warning", "text-destructive"],
    example: "Altere TOKEN_MAPPING.battery_levels no UIInventory.ts"
  }
};