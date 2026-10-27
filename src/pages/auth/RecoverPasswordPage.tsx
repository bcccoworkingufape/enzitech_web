import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useField } from '@/components/useField';
import { useSnackbar } from '@/context/SnackbarContext';
import { rules } from '@/lib/validators';

export function RecoverPasswordPage() {
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const email = useField('', [rules.required(), rules.email()]);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    email.touch();
    if (!email.valid) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email.value.trim());
      snackbar.show('E-mail de recuperação enviado com sucesso!', { type: 'success' });
      navigate(`/verificar-codigo?email=${encodeURIComponent(email.value.trim())}`);
    } catch (error) {
      snackbar.show(errorMessage(error, { useBackendMessage: true }), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Recuperar Senha"
      description="Informe seu e-mail abaixo. Enviaremos as instruções para você redefinir a sua senha."
      steps={[1, 3]}
      footer={<Link to="/login" className="link">Voltar para o login</Link>}
    >
      <form onSubmit={onSubmit} noValidate>
        <TextField label="E-mail" type="email" autoComplete="email" autoFocus {...email.props} />
        <Button type="submit" block disabled={!email.value} loading={loading} style={{ marginTop: 8 }}>
          Enviar E-mail
        </Button>
      </form>
    </AuthLayout>
  );
}
