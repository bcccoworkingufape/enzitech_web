import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { PasswordRequirements } from '@/components/PasswordRequirements';
import { TextField } from '@/components/TextField';
import { useField } from '@/components/useField';
import { useSnackbar } from '@/context/SnackbarContext';
import { rules } from '@/lib/validators';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const state = useLocation().state as { email?: string; token?: string } | null;
  const newPassword = useField('', [rules.required(), rules.strongPassword()]);
  const confirm = useField('', [rules.required(), rules.equals(() => newPassword.value)]);
  const [loading, setLoading] = useState(false);

  if (!state?.email || !state.token) return <Navigate to="/recuperar-senha" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    newPassword.touch();
    confirm.touch();
    if (!newPassword.valid || !confirm.valid) return;
    setLoading(true);
    try {
      await authApi.resetPassword(state.email!, state.token!, newPassword.value);
      snackbar.show('Senha redefinida com sucesso!', { type: 'success' });
      navigate('/login', { replace: true });
    } catch (error) {
      snackbar.show(errorMessage(error, { useBackendMessage: true }), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Redefinir Senha" description="Escolha uma nova senha para sua conta." steps={[3, 3]} footer={<Link to="/login" className="link">Voltar para o login</Link>}>
      <form onSubmit={onSubmit} noValidate>
        <TextField label="Nova Senha" type="password" autoComplete="new-password" autoFocus {...newPassword.props} />
        <PasswordRequirements password={newPassword.value} />
        <TextField label="Confirmar Nova Senha" type="password" autoComplete="new-password" {...confirm.props} />
        <Button type="submit" block disabled={!newPassword.value || !confirm.value} loading={loading} style={{ marginTop: 8 }}>
          Redefinir Senha
        </Button>
      </form>
    </AuthLayout>
  );
}
