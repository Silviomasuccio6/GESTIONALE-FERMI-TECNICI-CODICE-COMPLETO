import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authUseCases } from "../../../application/usecases/auth-usecases";
import { AuthShell } from "../../components/layout/auth-shell";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export const SignupPage = () => {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    try {
      const result = await authUseCases.signup({
        tenantName: String(formData.get("tenantName")),
        firstName: String(formData.get("firstName")),
        lastName: String(formData.get("lastName")),
        email: String(formData.get("email")),
        password: String(formData.get("password"))
      });
      setTenantId(result.tenantId);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AuthShell title="Crea account" subtitle="Avvia il tuo ambiente con credenziali admin iniziali.">
      <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="tenantName">Nome azienda</Label>
          <Input id="tenantName" name="tenantName" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="firstName">Nome</Label>
          <Input id="firstName" name="firstName" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lastName">Cognome</Label>
          <Input id="lastName" name="lastName" required />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        {tenantId && <Alert className="md:col-span-2 border-emerald-300 bg-emerald-50 text-emerald-700">Tenant creato: {tenantId}</Alert>}
        {error && <Alert className="md:col-span-2 border-destructive/40 bg-destructive/10 text-destructive">{error}</Alert>}
        <Button type="submit" className="md:col-span-2">Crea account</Button>
        <Button type="button" variant="outline" className="md:col-span-2" onClick={() => navigate("/login")}>Vai al login</Button>
      </form>
    </AuthShell>
  );
};
