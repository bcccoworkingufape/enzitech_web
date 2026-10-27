import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '@/api/client';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useField } from '@/components/useField';
import { useAuth } from '@/context/AuthContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { fieldRules, rules } from '@/lib/validators';

export function LoginPage() {
  const { login } = useAuth();
  const snackbar = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();
  const email = useField('', fieldRules.email);
  const password = useField('', [rules.required()]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!email.valid || !password.valid) return;
    setLoading(true);
    try {
      const user = await login(email.value.trim(), password.value);
      snackbar.show(`Bem vindo(a) ${user.name}!`, { type: 'success' });
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/experimentos', { replace: true });
    } catch (error) {
      snackbar.show(errorMessage(error, { isLogin: true }), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={'Olá,\nseja bem vindo(a)!'}
      description="Entre com sua conta para acessar seus experimentos."
      footer={
        <>
          Não possui uma conta?{' '}
          <Link to="/cadastro" className="link">
            Crie uma
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <TextField label="E-mail" type="email" autoComplete="email" autoFocus {...email.props} error={submitted ? email.error : null} />
        <TextField label="Senha" type="password" autoComplete="current-password" {...password.props} error={submitted ? password.error : null} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '-6px 0 24px' }}>
          <Link to="/recuperar-senha" className="link">
            Esqueci minha senha
          </Link>
        </div>
        <Button type="submit" block loading={loading}>
          Entrar
        </Button>
      </form>
    </AuthLayout>
  );
}
