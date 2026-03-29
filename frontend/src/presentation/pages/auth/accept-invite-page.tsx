import { FormEvent, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authUseCases } from "../../../application/usecases/auth-usecases";
import { AuthShell } from "../../components/layout/auth-shell";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export const AcceptInvitePage = () => {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError("Token invito mancante.");
      return;
    }

    const form = new FormData(event.currentTarget);
    try {
      await authUseCases.acceptInvite({
        token,
        firstName: String(form.get("firstName") || "").trim(),
        lastName: String(form.get("lastName") || "").trim(),
        password: String(form.get("password") || "")
      });
      setMessage("Invito accettato. Puoi ora accedere.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AuthShell title="Completa attivazione account" subtitle="Conferma i tuoi dati e imposta la password iniziale.">
      <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <Label>Nome</Label>
          <Input name="firstName" required />
        </div>
        <div className="grid gap-2">
          <Label>Cognome</Label>
          <Input name="lastName" required />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label>Password</Label>
          <Input name="password" type="password" required />
        </div>
        {message && <Alert className="md:col-span-2 border-emerald-300 bg-emerald-50 text-emerald-700">{message}</Alert>}
        {error && <Alert className="md:col-span-2 border-destructive/40 bg-destructive/10 text-destructive">{error}</Alert>}
        <Button type="submit" className="md:col-span-2">Attiva account</Button>
      </form>
    </AuthShell>
  );
};
