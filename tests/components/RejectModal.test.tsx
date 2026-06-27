import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RejectModal } from '../../src/pages/moviment/CadastralMovimentDefaut';

describe('RejectModal', () => {
  it('confirm button is disabled when reason is empty', () => {
    render(<RejectModal onConfirm={() => {}} onClose={() => {}} />);
    const btn = screen.getByRole('button', { name: /Confirmar rejeição/i });
    expect(btn).toBeDisabled();
  });

  it('confirm button is enabled after user types a reason', async () => {
    const user = userEvent.setup();
    render(<RejectModal onConfirm={() => {}} onClose={() => {}} />);
    await user.type(screen.getByRole('textbox'), 'CPF divergente.');
    expect(screen.getByRole('button', { name: /Confirmar rejeição/i })).not.toBeDisabled();
  });

  it('confirm button is disabled when reason contains only whitespace', async () => {
    const user = userEvent.setup();
    render(<RejectModal onConfirm={() => {}} onClose={() => {}} />);
    await user.type(screen.getByRole('textbox'), '   ');
    expect(screen.getByRole('button', { name: /Confirmar rejeição/i })).toBeDisabled();
  });

  it('calls onConfirm with trimmed reason when confirmed', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<RejectModal onConfirm={onConfirm} onClose={() => {}} />);
    await user.type(screen.getByRole('textbox'), ' Motivo válido ');
    await user.click(screen.getByRole('button', { name: /Confirmar rejeição/i }));
    expect(onConfirm).toHaveBeenCalledWith('Motivo válido');
  });

  it('calls onClose when Cancelar is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<RejectModal onConfirm={() => {}} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
