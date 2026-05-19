import { useState } from "react";
import { Plus, Pencil, Trash2, Save, X, Eye, EyeOff, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Employee } from "@/hooks/useEmployees";

interface EmployeesTabProps {
  isAdmin: boolean;
  currentUserId?: string;
  employees: Employee[];
  employeesLoading: boolean;
  authLoading: boolean;
  onAdd: (data: { name: string; username: string; password: string; role: string }) => void;
  onUpdate: (data: { id: string; auth_id?: string | null; name?: string; username?: string; password?: string; role?: string }) => void;
  onDelete: (data: { id: string; auth_id?: string | null }) => void;
  isAddPending: boolean;
}

export function EmployeesTab({
  isAdmin, currentUserId, employees, employeesLoading, authLoading,
  onAdd, onUpdate, onDelete, isAddPending,
}: EmployeesTabProps) {
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [showNewPass, setShowNewPass] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [editAuthId, setEditAuthId] = useState<string | null>(null);
  const [showEditPass, setShowEditPass] = useState(false);

  const handleAdd = () => {
    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) return;
    onAdd({ name: newName.trim(), username: newUsername.trim().toLowerCase(), password: newPassword, role: newRole });
    setNewName(""); setNewUsername(""); setNewPassword(""); setNewRole("user"); setShowNew(false);
  };

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setEditName(emp.name);
    setEditUsername(emp.username);
    setEditPassword("");
    setEditRole(emp.role);
    setEditAuthId(emp.auth_id ?? null);
    setShowEditPass(false);
  };

  const handleSave = (id: string) => {
    const payload: any = { id, auth_id: editAuthId, name: editName, username: editUsername.toLowerCase(), role: editRole };
    if (editPassword.trim()) payload.password = editPassword;
    onUpdate(payload);
    setEditingId(null);
  };

  const visibleEmployees = employees.filter(emp => isAdmin || emp.id === currentUserId);

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold">Funcionários Cadastrados</h3>
          <Button onClick={() => setShowNew(!showNew)} className="gap-1.5"><Plus className="h-4 w-4" /> Novo Funcionário</Button>
        </div>
      )}

      {showNew && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Cadastrar Funcionário</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Nome Completo</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Maria Silva" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Login</Label><Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Ex: maria" /></div>
            <div className="space-y-1.5">
              <Label className="text-xs">Senha</Label>
              <div className="relative">
                <Input type={showNewPass ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Senha de acesso" className="pr-10" />
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
              <Button onClick={handleAdd} disabled={isAddPending || !newName.trim() || !newUsername.trim() || !newPassword.trim()}>Salvar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {authLoading || employeesLoading ? (
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
                {visibleEmployees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>{editingId === emp.id ? <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" /> : emp.name}</TableCell>
                    <TableCell>{editingId === emp.id ? <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="h-8" /> : <span className="font-mono text-sm">{emp.username}</span>}</TableCell>
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
                                <Input type={showEditPass ? "text" : "password"} value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Nova senha (vazio = manter)" className="h-8 w-40 pr-8 text-xs" />
                                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full w-8 hover:bg-transparent" onClick={() => setShowEditPass(!showEditPass)} tabIndex={-1}>
                                  {showEditPass ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSave(emp.id)}><Save className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(emp)}><Pencil className="h-3.5 w-3.5" /></Button>
                            {isAdmin && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remover funcionário?</AlertDialogTitle>
                                    <AlertDialogDescription>O acesso de "{emp.name}" ({emp.username}) será removido permanentemente.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete({ id: emp.id, auth_id: emp.auth_id })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sim, remover</AlertDialogAction>
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
                {visibleEmployees.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum funcionário cadastrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
