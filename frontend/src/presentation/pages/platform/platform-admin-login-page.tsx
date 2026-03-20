import { FormEvent, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { platformAdminUseCases } from "../../../application/usecases/platform/platform-admin-usecases";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";

export const PlatformAdminLoginPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);

    try {
      await platformAdminUseCases.login({
        email: String(form.get("email") || ""),
        password: String(form.get("password") || "")
      });
      navigate("/console");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="platform-login-stage min-h-screen bg-background px-4 py-10">
      <div className="platform-login-glow" aria-hidden="true" />
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        <div className="platform-login-panel rounded-xl border bg-card p-7 shadow-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Secure Platform Access</p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight">Control Tower privata per licenze SaaS multi-tenant</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Accesso limitato a host/IP autorizzati, sessioni brevi, audit immutabile e alert automatici.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li className="platform-login-list-item">127.0.0.1 only + IP allowlist</li>
            <li className="platform-login-list-item">JWT separato + lock anti brute-force</li>
            <li className="platform-login-list-item">Alert email su accessi anomali e cambi licenza</li>
          </ul>
        </div>

        <Card className="platform-login-form-card border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <LockKeyhole className="h-5 w-5" />
              Login Console Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={onSubmit}>
              <div className="grid gap-1.5">
                <Label>Email admin</Label>
                <Input className="platform-login-input" name="email" type="email" autoComplete="username" required />
              </div>
              <div className="grid gap-1.5">
                <Label>Password</Label>
                <Input className="platform-login-input" name="password" type="password" autoComplete="current-password" required />
              </div>

              {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

              <Button className="platform-login-submit" type="submit" disabled={loading}>
                {loading ? "Verifica credenziali..." : "Accedi alla Console"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
