import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authUseCases } from "../../../application/usecases/auth-usecases";
import { AuthShell } from "../../components/layout/auth-shell";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export const ForgotPasswordPage = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);

    try {
      await authUseCases.forgotPassword(String(form.get("email")));
      setMessage("Se la email esiste, riceverai un link di reset a breve.");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AuthShell title="Recupera password" subtitle="Inserisci la tua email per ricevere il link di reimpostazione.">
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <Label>Email</Label>
          <Input name="email" type="email" required />
        </div>
        {message && <Alert className="border-emerald-300 bg-emerald-50 text-emerald-700">{message}</Alert>}
        {error && <Alert className="border-destructive/40 bg-destructive/10 text-destructive">{error}</Alert>}
        <Button type="submit">Invia link</Button>
        <Button type="button" variant="outline" onClick={() => navigate("/login")}>Torna al login</Button>
      </form>
    </AuthShell>
  );
};
