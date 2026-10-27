import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { PasswordRequirements } from '@/components/PasswordRequirements';
import { TextField } from '@/components/TextField';
import { useField } from '@/components/useField';
import { useSnackbar } from '@/context/SnackbarContext';
import { fieldRules, rules } from '@/lib/validators';

export function CreateAccountPage() {
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const name = useField('', fieldRules.name);
  const institution = useField('', fieldRules.institution);
  const email = useField('', fieldRules.email);
  const password = useField('', fieldRules.password);
  const confirm = useField('', [rules.required(), rules.equals(() => password.value)]);

  const firstStepValid = name.valid && institution.valid;
  const secondStepValid = email.valid && password.valid && confirm.valid;

  const submit = async () => {
    if (!secondStepValid) return;
    setLoading(true);
    try {
      await authApi.createAccount(name.value.trim(), email.value.trim(), password.value);
      snackbar.show('Conta criada com sucesso!', { type: 'success' });
      navigate('/login', { replace: true });
    } catch (error) {
      snackbar.show(errorMessage(error), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Cadastre-se"
      description={step === 1 ? 'Dados pessoais' : 'Acesso'}
      steps={[step, 2]}
      footer={
        <>
          Já possui uma conta?{' '}
          <Link to="/login" className="link">
            Entrar
          </Link>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 1) {
            if (firstStepValid) setStep(2);
          } else submit();
        }}
      >
        {step === 1 ? (
          <>
            <TextField label="Nome" autoComplete="name" autoFocus {...name.props} />
            <TextField label="Instituição" autoComplete="organization" {...institution.props} />
            <Button type="submit" block disabled={!firstStepValid} style={{ marginTop: 8 }}>
              Próximo
            </Button>
          </>
        ) : (
          <>
            <TextField label="E-mail" type="email" autoComplete="email" autoFocus {...email.props} />
            <TextField label="Senha" type="password" autoComplete="new-password" {...password.props} />
            <PasswordRequirements password={password.value} />
            <TextField label="Confirmar senha" type="password" autoComplete="new-password" {...confirm.props} />
            <div className="btn-stack" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <Button type="submit" block disabled={!secondStepValid} loading={loading}>
                Criar conta
              </Button>
              <Button variant="text" block onClick={() => setStep(1)}>
                Voltar
              </Button>
            </div>
          </>
        )}
      </form>
    </AuthLayout>
  );
}
