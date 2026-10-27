import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useField } from '@/components/useField';
import { useSnackbar } from '@/context/SnackbarContext';
import { sanitizeInteger } from '@/lib/format';
import { rules } from '@/lib/validators';

export function VerifyCodePage() {
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const [params] = useSearchParams();
  const email = params.get('email') ?? '';
  const code = useField('', [rules.required()]);
  const [loading, setLoading] = useState(false);

  if (!email) return <Navigate to="/recuperar-senha" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    code.touch();
    if (!code.valid) return;
    setLoading(true);
    try {
      await authApi.verifyPin(email, code.value.trim());
      navigate('/redefinir-senha', { state: { email, token: code.value.trim() } });
    } catch (error) {
      snackbar.show(errorMessage(error, { useBackendMessage: true }), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verificar Código"
      description={<>Digite o código de 6 dígitos que enviamos para <strong>{email}</strong>.</>}
      steps={[2, 3]}
      footer={<Link to="/recuperar-senha" className="link">Usar outro e-mail</Link>}
    >
      <form onSubmit={onSubmit} noValidate>
        <TextField
          label="Código de Recuperação"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          style={{ letterSpacing: '0.4em', fontSize: 20, textAlign: 'center' }}
          {...code.props}
          onChange={(v) => code.props.onChange(sanitizeInteger(v))}
        />
        <Button type="submit" block disabled={!code.value} loading={loading} style={{ marginTop: 8 }}>
          Verificar
        </Button>
      </form>
    </AuthLayout>
  );
}
