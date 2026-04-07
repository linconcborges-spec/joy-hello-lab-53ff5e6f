import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Eye, EyeOff, Shield, User, Moon, Sun, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEmployees, useAddEmployee, useUpdateEmployee, useDeleteEmployee } from "@/hooks/useEmployees";
import { useSettings } from "@/hooks/useSettings";
import { useOrders } from "@/hooks/useOrders";
import { useTheme } from "next-themes";
import { exportOrdersToCSV, exportFullSystemBackup, importFullSystemBackup } from "@/lib/ExportService";
import { toast } from "sonner";

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { theme, setTheme } = useTheme();
  const { data: employees = [], isLoading } = useEmployees();
  const { data: orders = [] } = useOrders(); // Pega pedidos do ciclo atual
  const addEmployee = useAddEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const { settings, updateSettings } = useSettings();

  // General settings state
  const [storeName, setStoreName] = useState(settings.storeName);
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState(settings.defaultDeliveryFee);
  const [printPaperWidth, setPrintPaperWidth] = useState(settings.printPaperWidth);
  const [printMargin, setPrintMargin] = useState(settings.printMargin);
  const [printMarginTop, setPrintMarginTop] = useState(settings.printMarginTop || "0mm");
  const [printFontSize, setPrintFontSize] = useState(settings.printFontSize);
  const [targetPrinter, setTargetPrinter] = useState(settings.targetPrinter || "");
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);

  useEffect(() => {
    // Try fetching printers from Tauri if available
    const win = window as any;
    if (win.__TAURI_INTERNALS__) {
      import("@tauri-apps/api/tauri").then(({ invoke: tauriInvoke }) => {
        tauriInvoke<string[]>("get_printers").then((res) => {
          setAvailablePrinters(res);
        }).catch(console.error);
      }).catch(console.error);
    }
  }, []);

  // New employee form
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [showNewPass, setShowNewPass] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [showEditPass, setShowEditPass] = useState(false);

  const handleAdd = () => {
    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) return;
    addEmployee.mutate(
      { name: newName.trim(), username: newUsername.trim().toLowerCase(), password: newPassword, role: newRole },
      {
        onSuccess: () => {
          setNewName(""); setNewUsername(""); setNewPassword(""); setNewRole("user"); setShowNew(false);
        },
      }
    );
  };

  const handleSave = (id: string) => {
    const payload: any = { id, name: editName, username: editUsername.toLowerCase(), role: editRole };
    if (editPassword.trim()) payload.password = editPassword;
    updateEmployee.mutate(payload, { onSuccess: () => setEditingId(null) });
  };

  const handleSaveGeneral = () => {
    updateSettings({ storeName, defaultDeliveryFee, printPaperWidth, printMargin, printMarginTop, printFontSize, targetPrinter });
    toast.success("Configurações atualizadas com sucesso!");
  };

  const startEdit = (emp: any) => {
    setEditingId(emp.id);
    setEditName(emp.name);
    setEditUsername(emp.username);
    setEditPassword("");
    setEditRole(emp.role);
    setShowEditPass(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        importFullSystemBackup(json);
      } catch (error) {
        toast.error("Format de arquivo inválido. Use o backup .json");
      }
    };
    reader.readAsText(file);
    // Limpar o input para permitir importar o mesmo arquivo se necessário
    e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Configurações Gerais</h2>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-primary">Aparência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center border border-border/40 text-primary">
                  {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-bold">Modo de Cor</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Trocar entre tema Claro e Escuro</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase opacity-50">Claro</span>
                <Switch 
                  checked={theme === "dark"} 
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
                />
                <span className="text-[10px] font-black uppercase opacity-50">Escuro</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-primary">Estabelecimento</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do Estabelecimento</Label>
              <Input 
                value={storeName} 
                onChange={(e) => setStoreName(e.target.value)} 
                placeholder="Ex: Império Chiclets" 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Taxa de Entrega Padrão (R$)</Label>
              <Input 
                type="number" 
                step="0.01" 
                min={0} 
                value={defaultDeliveryFee === 0 ? "" : defaultDeliveryFee} 
                onChange={(e) => setDefaultDeliveryFee(parseFloat(e.target.value) || 0)} 
                placeholder="0.00" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-primary">Configurações de Impressão</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Largura do Papel (ex: 80mm)</Label>
              <Input 
                value={printPaperWidth} 
                onChange={(e) => setPrintPaperWidth(e.target.value)} 
                placeholder="80mm" 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-primary">Espaço Superior (ex: 3cm)</Label>
              <Input 
                value={printMarginTop} 
                onChange={(e) => setPrintMarginTop(e.target.value)} 
                placeholder="3cm ou 30mm" 
                className="border-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Margens Laterais (ex: 0mm)</Label>
              <Input 
                value={printMargin} 
                onChange={(e) => setPrintMargin(e.target.value)} 
                placeholder="0mm" 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tamanho da Fonte (ex: 14px)</Label>
              <Input 
                value={printFontSize} 
                onChange={(e) => setPrintFontSize(e.target.value)} 
                placeholder="14px" 
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-primary">Nome da Impressora de Destino (Modo Offline / Executável)</Label>
              {availablePrinters.length > 0 ? (
                <Select value={targetPrinter || "default"} onValueChange={(v) => setTargetPrinter(v === "default" ? "" : v)}>
                  <SelectTrigger className="border-primary/20 bg-primary/5 font-medium">
                    <SelectValue placeholder="Selecione a impressora..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default" className="italic font-bold text-muted-foreground">- IMPRESSORA PADRÃO DO WINDOWS -</SelectItem>
                    {availablePrinters.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input 
                  value={targetPrinter} 
                  onChange={(e) => setTargetPrinter(e.target.value)} 
                  placeholder="Ex: POS-58 ou XP-80C (Apenas visível via Tauri App)" 
                  className="border-primary/20 bg-primary/5"
                />
              )}
              <p className="text-[9px] text-muted-foreground leading-tight pt-1">
                *Para visualizar a lista de impressoras do Windows magicamente aqui, use o executável offline em vez do navegador.
              </p>
            </div>
            <div className="sm:col-span-3 flex justify-end pt-2">
              <Button onClick={handleSaveGeneral} className="gap-1.5">
                <Save className="h-4 w-4" /> Salvar Configurações
              </Button>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <div className="flex items-center justify-between pt-4 border-t">
            <h2 className="text-xl font-bold">Configurações — Funcionários</h2>
            <Button onClick={() => setShowNew(!showNew)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Novo Funcionário
            </Button>
          </div>
        )}

        {!isAdmin && (
          <div className="flex items-center justify-between pt-4 border-t">
            <h2 className="text-xl font-bold">Minha Conta</h2>
          </div>
        )}

        {showNew && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cadastrar Funcionário</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome Completo</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Maria Silva" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Login</Label>
                <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Ex: maria" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Senha</Label>
                <div className="relative">
                  <Input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Senha de acesso"
                    className="pr-10"
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowNewPass(!showNewPass)} tabIndex={-1}>
                    {showNewPass ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Papel</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button onClick={handleAdd} disabled={addEmployee.isPending || !newName.trim() || !newUsername.trim() || !newPassword.trim()}>
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead className="w-28">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees
                    .filter(emp => isAdmin || emp.id === user?.id)
                    .map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        {editingId === emp.id ? (
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" />
                        ) : (
                          emp.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === emp.id ? (
                          <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="h-8" />
                        ) : (
                          <span className="font-mono text-sm">{emp.username}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === emp.id ? (
                          <Select value={editRole} onValueChange={setEditRole}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuário</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={emp.role === "admin" ? "default" : "secondary"} className="gap-1">
                            {emp.role === "admin" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                            {emp.role === "admin" ? "Admin" : "Usuário"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {editingId === emp.id ? (
                            <>
                              <div className="flex items-center gap-1">
                                <div className="relative">
                                  <Input
                                    type={showEditPass ? "text" : "password"}
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    placeholder="Nova senha (vazio = manter)"
                                    className="h-8 w-40 pr-8 text-xs"
                                  />
                                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full w-8 hover:bg-transparent" onClick={() => setShowEditPass(!showEditPass)} tabIndex={-1}>
                                    {showEditPass ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                  </Button>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSave(emp.id)}>
                                <Save className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(emp)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                                {isAdmin && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remover funcionário?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          O acesso de "{emp.name}" ({emp.username}) será removido permanentemente.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteEmployee.mutate(emp.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                          Sim, remover
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {employees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum funcionário cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        {isAdmin && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-primary">Backup e Manutenção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-primary">Backup Completo do Sistema (RESTAURAÇÃO)</p>
                  <p className="text-xs text-muted-foreground">Baixe TODA a base de dados (produtos, categorias, configurações, histórico total) para um arquivo JSON seguro.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button 
                    onClick={() => exportFullSystemBackup()} 
                    className="gap-2 h-11 bg-primary hover:bg-primary/90"
                  >
                    <Download className="h-4 w-4" /> Exportar JSON
                  </Button>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      title="Importar Backup"
                    />
                    <Button 
                      variant="outline"
                      className="gap-2 h-11 border-primary/30"
                    >
                      <Plus className="h-4 w-4" /> Importar JSON
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-secondary/20 border border-border/40">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Relatório de Pedidos (CSV)</p>
                  <p className="text-xs text-muted-foreground">Baixe apenas o resumo dos pedidos atuais para análise manual no Excel.</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => exportOrdersToCSV(orders)} 
                  disabled={orders.length === 0}
                  className="gap-2 shrink-0 border-primary/20 hover:bg-primary/5 h-11"
                >
                  <Download className="h-4 w-4" /> Exportar CSV
                </Button>
              </div>
              
              <p className="text-[10px] text-muted-foreground italic text-center">
                * O backup em JSON permite restaurar o sistema em caso de perda total de dados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
