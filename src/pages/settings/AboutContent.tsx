const TEAM: [string, string][] = [
  ['Armstrong Lohãns', '(Desenvolvedor mobile)'],
  ['Matheus Noronha', '(Desenvolvedor back-end)'],
  ['Weverton Cintra', '(Desenvolvedor back-end)'],
  ['José Vieira', '(Desenvolvedor mobile)'],
  ['Guilherme Felix', '(Desenvolvedor mobile & back-end)'],
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
      <ul>
        {TEAM.map(([name, role]) => (
          <li key={name}>
            <strong>{name}</strong> {role}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FaqContent() {
  return (
    <div className="about">
      <p>
        <strong>Pergunta: </strong>Por que não consigo criar enzimas?
      </p>
      <p>
        <strong>Resposta: </strong>A funcionalidade de criação de enzimas é restrita ao administrador do Enzitech, pois
        atualmente para o cadastro de uma enzima é necessário sua implementação até que a mesma possa estar disponível
        para uso, caso necessite de algum novo tipo de enzima solicite ao administrador do sistema.
      </p>
    </div>
  );
}
