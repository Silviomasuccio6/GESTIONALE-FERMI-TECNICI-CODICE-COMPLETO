import { FormEvent, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authUseCases } from "../../../application/usecases/auth-usecases";
import { AuthShell } from "../../components/layout/auth-shell";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export const ResetPasswordPage = () => {
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
      setError("Token reset mancante.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("password") || "");

    try {
      await authUseCases.resetPassword({ token, newPassword });
      setMessage("Password aggiornata. Ora puoi accedere.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AuthShell title="Nuova password" subtitle="Imposta una nuova password sicura per il tuo account.">
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <Label>Nuova password</Label>
          <Input name="password" type="password" required />
        </div>
        {message && <Alert className="border-emerald-300 bg-emerald-50 text-emerald-700">{message}</Alert>}
        {error && <Alert className="border-destructive/40 bg-destructive/10 text-destructive">{error}</Alert>}
        <Button type="submit">Aggiorna password</Button>
      </form>
    </AuthShell>
  );
};
