import { CaretDown } from '@phosphor-icons/react';
import { initials } from '@/components/AppShell';

const TEAM: [string, string][] = [
  ['Armstrong Lohãns', 'Desenvolvedor mobile'],
  ['Matheus Noronha', 'Desenvolvedor back-end'],
  ['Weverton Cintra', 'Desenvolvedor back-end'],
  ['José Vieira', 'Desenvolvedor mobile'],
  ['Guilherme Felix', 'Desenvolvedor mobile & back-end'],
];

const COORDINATION: [string, string][] = [
  ['Eduarda Interaminense', 'Gestão do projeto'],
  ['Rodrigo Rocha', 'Docente - BCC'],
  ['Jean Teixeira', 'Docente - BCC'],
  ['Igor Medeiros', 'Docente - BCC'],
  ['Erika Valente', 'Docente - Agronomia'],
  ['Jamille Barros', 'Docente - Agronomia'],
];

function People({ people }: { people: [string, string][] }) {
  return (
    <ul className="team">
      {people.map(([name, role]) => (
        <li key={name}>
          <span className="avatar">{initials(name)}</span>
          <div>
            <div className="team-name">{name}</div>
            <div className="team-role">{role}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

const FAQ: [string, string][] = [
  [
    'Por que não consigo criar enzimas?',
    'A funcionalidade de criação de enzimas é restrita ao administrador do Enzitech, pois atualmente para o cadastro de uma enzima é necessário sua implementação até que a mesma possa estar disponível para uso. Caso necessite de algum novo tipo de enzima, solicite ao administrador do sistema.',
  ],
];

export function AboutContent() {
  return (
    <div className="about">
      <h3>Idealização</h3>
      <p>
        O <strong>Enzitech</strong> foi concebido como uma solução para o estudo e realização de experimentos no campo
        das atividades enzimáticas do solo, idealizado em conjunto pelo <strong>Laboratório BCC Coworking</strong> e o{' '}
        <strong>Laboratório de Enzimologia e Microbiologia Ambiental (LEMA)</strong>, localizados na{' '}
        <strong>Universidade Federal do Agreste de Pernambuco (UFAPE)</strong>.
      </p>
      <h3>Equipe de desenvolvimento</h3>
      <People people={TEAM} />
      <h3>Gestão e orientação</h3>
      <People people={COORDINATION} />
    </div>
  );
}

export function FaqContent() {
  return (
    <div className="faq">
      {FAQ.map(([question, answer]) => (
        <details key={question} open={FAQ.length === 1}>
          <summary>
            {question}
            <CaretDown size={16} />
          </summary>
          <p>{answer}</p>
        </details>
      ))}
    </div>
  );
}
