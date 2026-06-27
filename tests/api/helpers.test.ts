import { describe, it, expect } from 'vitest';
import { makeLabel, mapSev, getField, stateMeta } from '../../src/api/helpers';
import type { ApiBatchSchemaField, ApiOccurrenceField } from '../../src/api/types';

const mockProvenance = { state: 'Automatic', description: '' };

const makeField = (key: string, value: string): ApiOccurrenceField => ({
  key, value, originalValue: null, lastEditedBy: null, lastEditedAt: null, provenance: mockProvenance,
});

// ===== makeLabel =====

describe('makeLabel', () => {
  it('builds a Record<string, string> from ApiBatchSchemaField[]', () => {
    const fields: ApiBatchSchemaField[] = [
      { key: 'nome',    displayLabel: 'Beneficiário', displayOrder: 1 },
      { key: 'cpf',     displayLabel: 'CPF / CNPJ',   displayOrder: 2 },
      { key: 'destino', displayLabel: 'Operadora',     displayOrder: 3 },
    ];
    expect(makeLabel(fields)).toEqual({
      nome: 'Beneficiário',
      cpf:  'CPF / CNPJ',
      destino: 'Operadora',
    });
  });

  it('returns empty object for empty fields array', () => {
    expect(makeLabel([])).toEqual({});
  });

  it('uses displayLabel not field key', () => {
    const fields: ApiBatchSchemaField[] = [
      { key: 'cpf', displayLabel: 'Cadastro de Pessoa Física', displayOrder: 1 },
    ];
    const label = makeLabel(fields);
    expect(label['cpf']).toBe('Cadastro de Pessoa Física');
    expect(label['cpf']).not.toBe('cpf');
  });
});

// ===== mapSev =====

describe('mapSev', () => {
  it("maps 'Error' to 'erro'", () => {
    expect(mapSev('Error')).toBe('erro');
  });

  it("maps 'Warning' to 'aviso'", () => {
    expect(mapSev('Warning')).toBe('aviso');
  });

  it("maps any other value to 'info'", () => {
    expect(mapSev('Info')).toBe('info');
    expect(mapSev('Unknown')).toBe('info');
    expect(mapSev('')).toBe('info');
  });
});

// ===== getField =====

describe('getField', () => {
  const fields = [makeField('nome', 'João Silva'), makeField('cpf', '123.456.789-00')];

  it('returns value for known key', () => {
    expect(getField(fields, 'nome')).toBe('João Silva');
    expect(getField(fields, 'cpf')).toBe('123.456.789-00');
  });

  it("returns '—' for unknown key", () => {
    expect(getField(fields, 'plano')).toBe('—');
  });
});

// ===== stateMeta =====

describe('stateMeta', () => {
  it("maps 'Pending' to Portuguese label and CSS class", () => {
    const { l, c } = stateMeta('Pending');
    expect(l).toBe('Pendente');
    expect(c).toBe('st-pend');
  });

  it("maps 'Approved' to Portuguese label", () => {
    expect(stateMeta('Approved').l).toBe('Aprovado');
  });

  it("maps 'Rejected' to Portuguese label", () => {
    expect(stateMeta('Rejected').l).toBe('Rejeitado');
  });

  it("maps 'Disabled' to Portuguese label", () => {
    expect(stateMeta('Disabled').l).toBe('Desabilitado');
  });

  it('falls back to raw state for unknown values', () => {
    const { l, c } = stateMeta('SomeUnknownState');
    expect(l).toBe('SomeUnknownState');
    expect(c).toBe('st-pend');
  });
});
