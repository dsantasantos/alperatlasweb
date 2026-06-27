import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ValidationGroup } from '../../src/pages/moviment/CadastralMovimentDefaut';
import type { ApiValidation } from '../../src/api/types';

const makeValidation = (severity: string, message: string, dimension = 'Capture'): ApiValidation => ({
  ruleKey: 'rule-1', dimension, severity, message, fieldKey: 'cpf',
});

describe('ValidationGroup', () => {
  it('renders "Sem apontamentos." when items array is empty', () => {
    render(<ValidationGroup title="Conformidade da captura" hint="A tradução foi fiel?" items={[]} />);
    expect(screen.getByText('Sem apontamentos.')).toBeInTheDocument();
  });

  it('renders the title and hint', () => {
    render(<ValidationGroup title="Validade da movimentação" hint="O evento faz sentido?" items={[]} />);
    expect(screen.getByText('Validade da movimentação')).toBeInTheDocument();
    expect(screen.getByText('O evento faz sentido?')).toBeInTheDocument();
  });

  it('renders validation messages when items are provided', () => {
    const items = [
      makeValidation('Error',   'CPF inválido'),
      makeValidation('Warning', 'Plano divergente'),
    ];
    render(<ValidationGroup title="Conformidade da captura" hint="Fiel?" items={items} />);
    expect(screen.getByText('CPF inválido')).toBeInTheDocument();
    expect(screen.getByText('Plano divergente')).toBeInTheDocument();
  });

  it('does not render "Sem apontamentos." when items are provided', () => {
    const items = [makeValidation('Error', 'Erro qualquer')];
    render(<ValidationGroup title="Captura" hint="Fiel?" items={items} />);
    expect(screen.queryByText('Sem apontamentos.')).not.toBeInTheDocument();
  });
});
