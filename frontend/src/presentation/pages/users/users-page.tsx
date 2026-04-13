import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../../application/stores/auth-store";
import { usersUseCases } from "../../../application/usecases/users-usecases";
import { PageHeader } from "../../components/layout/page-header";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

const ruoloLabel: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  OPERATOR: "Operatore",
  VIEWER: "Viewer"
};

const statoLabel: Record<string, string> = {
  ACTIVE: "Attivo",
  INVITED: "Invitato",
  SUSPENDED: "Sospeso"
};

export const UsersPage = () => {
  const actorRoles = useAuthStore((state) => state.user?.roles ?? []);
  const actorPermissions = useAuthStore((state) => state.user?.permissions ?? []);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<Array<"ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER">>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const roleRank: Record<string, number> = {
    ADMIN: 4,
    MANAGER: 3,
    OPERATOR: 2,
    VIEWER: 1
  };

  const actorPrimaryRole = useMemo(() => {
    if (actorRoles.includes("ADMIN")) return "ADMIN";
    if (actorRoles.includes("MANAGER")) return "MANAGER";
    if (actorRoles.includes("OPERATOR")) return "OPERATOR";
    return "VIEWER";
  }, [actorRoles]);

  const managedRoles = useMemo(
    () =>
      roles.filter((role) =>
        actorPrimaryRole === "ADMIN"
          ? true
          : actorPrimaryRole === "MANAGER"
            ? role === "OPERATOR" || role === "VIEWER"
            : false
      ),
    [actorPrimaryRole, roles]
  );

  const canSuspendUsers = actorPrimaryRole === "ADMIN";
  const canWriteUsers = actorPermissions.includes("users:write");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [usersRes, rolesRes] = await Promise.all([usersUseCases.list(), usersUseCases.listRoles()]);
    setUsers(usersRes.data);
    setRoles(rolesRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData().catch((e: Error) => {
      setError(e.message);
      setLoading(false);
    });
  }, []);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    setError(null);
    setSuccess(null);
    const form = new FormData(event.currentTarget);

    try {
      await usersUseCases.create({
        firstName: String(form.get("firstName") || "").trim(),
        lastName: String(form.get("lastName") || "").trim(),
        email: String(form.get("email") || "").trim(),
        password: String(form.get("password") || ""),
        roleKey: String(form.get("roleKey") || "OPERATOR")
      });
      setSuccess("Utente creato correttamente.");
      formEl.reset();
      await loadData();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const onRoleChange = async (userId: string, roleKey: "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER") => {
    setError(null);
    try {
      await usersUseCases.updateRole(userId, roleKey);
      await loadData();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const onStatusChange = async (userId: string, status: "ACTIVE" | "INVITED" | "SUSPENDED") => {
    setError(null);
    try {
      await usersUseCases.update(userId, { status });
      await loadData();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const onDelete = async (userId: string) => {
    setError(null);
    try {
      await usersUseCases.remove(userId);
      setSuccess("Utente disattivato.");
      await loadData();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const onInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    setError(null);
    setSuccess(null);
    const form = new FormData(event.currentTarget);

    try {
      await usersUseCases.invite({
        firstName: String(form.get("inviteFirstName") || "").trim(),
        lastName: String(form.get("inviteLastName") || "").trim(),
        email: String(form.get("inviteEmail") || "").trim(),
        roleKey: String(form.get("inviteRoleKey") || "OPERATOR")
      });
      setSuccess("Invito inviato con successo (email in coda).");
      formEl.reset();
      await loadData();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Caricamento utenti...</p>;
  if (error && users.length === 0)
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Riprova</Button>
      </div>
    );

  return (
    <section className="space-y-4">
      <PageHeader
        title="Utenti e Ruoli"
        subtitle="Gestione completa degli utenti interni: creazione, invito, ruolo, stato e disattivazione."
      />

      {canWriteUsers ? (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Nuovo utente</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" onSubmit={onCreate}>
            <div className="grid gap-1.5">
              <Label>Nome</Label>
              <Input name="firstName" required />
            </div>
            <div className="grid gap-1.5">
              <Label>Cognome</Label>
              <Input name="lastName" required />
            </div>
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input name="email" type="email" required />
            </div>
            <div className="grid gap-1.5">
              <Label>Password</Label>
              <Input name="password" type="password" required />
            </div>
            <div className="grid gap-1.5">
              <Label>Ruolo</Label>
              <Select name="roleKey" defaultValue={managedRoles[0] ?? "OPERATOR"}>
                {managedRoles.map((role) => (
                  <option key={role} value={role}>{ruoloLabel[role]}</option>
                ))}
              </Select>
            </div>
            <div className="xl:col-span-3">
              <Button type="submit">Crea utente</Button>
            </div>
          </form>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          {success && <p className="mt-3 text-sm text-emerald-700">{success}</p>}
        </CardContent>
      </Card>
      ) : null}

      {canWriteUsers ? (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Invita utente</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={onInvite}>
            <div className="grid gap-1.5">
              <Label>Nome</Label>
              <Input name="inviteFirstName" required />
            </div>
            <div className="grid gap-1.5">
              <Label>Cognome</Label>
              <Input name="inviteLastName" required />
            </div>
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input name="inviteEmail" type="email" required />
            </div>
            <div className="grid gap-1.5">
              <Label>Ruolo</Label>
              <Select name="inviteRoleKey" defaultValue={managedRoles[0] ?? "OPERATOR"}>
                {managedRoles.map((role) => (
                  <option key={role} value={role}>{ruoloLabel[role]}</option>
                ))}
              </Select>
            </div>
            <div className="xl:col-span-4">
              <Button type="submit" variant="secondary">Invia invito</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      ) : null}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Gestione utenti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:hidden">
            {users.map((user) => {
              const role = user.roles?.[0] ?? "OPERATOR";
              const targetRank = roleRank[role] ?? 1;
              const actorRank = roleRank[actorPrimaryRole] ?? 0;
              const canManageTarget = canWriteUsers && (actorPrimaryRole === "ADMIN" || targetRank < actorRank);
              return (
                <Card key={user.id} className="border-dashed">
                  <CardContent className="space-y-2 pt-4">
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <Select disabled={!canManageTarget} value={role} onChange={(e) => onRoleChange(user.id, e.target.value as any)}>
                      {managedRoles.map((r) => (
                        <option key={r} value={r}>{ruoloLabel[r]}</option>
                      ))}
                    </Select>
                    <Select disabled={!canManageTarget} value={user.status} onChange={(e) => onStatusChange(user.id, e.target.value as any)}>
                      <option value="ACTIVE">{statoLabel.ACTIVE}</option>
                      <option value="INVITED">{statoLabel.INVITED}</option>
                      {canSuspendUsers ? <option value="SUSPENDED">{statoLabel.SUSPENDED}</option> : null}
                    </Select>
                    <Button variant="destructive" size="sm" disabled={!canManageTarget} onClick={() => onDelete(user.id)}>Disattiva</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="hidden md:block">
            <Table className="text-[12px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const role = user.roles?.[0] ?? "OPERATOR";
                  const targetRank = roleRank[role] ?? 1;
                  const actorRank = roleRank[actorPrimaryRole] ?? 0;
                  const canManageTarget = canWriteUsers && (actorPrimaryRole === "ADMIN" || targetRank < actorRank);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="text-xs font-medium">{user.firstName} {user.lastName}</TableCell>
                      <TableCell className="text-xs">{user.email}</TableCell>
                      <TableCell>
                        <Select
                          className="h-7 text-[11px]"
                          disabled={!canManageTarget}
                          value={role}
                          onChange={(e) => onRoleChange(user.id, e.target.value as any)}
                        >
                          {managedRoles.map((r) => (
                            <option key={r} value={r}>{ruoloLabel[r]}</option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          className="h-7 text-[11px]"
                          disabled={!canManageTarget}
                          value={user.status}
                          onChange={(e) => onStatusChange(user.id, e.target.value as any)}
                        >
                          <option value="ACTIVE">{statoLabel.ACTIVE}</option>
                          <option value="INVITED">{statoLabel.INVITED}</option>
                          {canSuspendUsers ? <option value="SUSPENDED">{statoLabel.SUSPENDED}</option> : null}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          disabled={!canManageTarget}
                          onClick={() => onDelete(user.id)}
                        >
                          Disattiva
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
