import { describe, it, expect } from 'vitest';
import { makeLabel, mapSev, getField, stateMeta, resolveInputType } from '../../src/api/helpers';
import type { ApiSchemaField, ApiOccurrenceField } from '../../src/api/types';

const mockProvenance = { state: 'Automatic', description: '' };

const makeField = (key: string, value: string): ApiOccurrenceField => ({
  key, value, originalValue: null, lastEditedBy: null, lastEditedAt: null, provenance: mockProvenance,
});

const makeSchemaField = (key: string, displayLabel: string, displayOrder: number): ApiSchemaField => ({
  key, displayLabel, displayOrder, dataType: 'text', isRequired: false,
});

// ===== makeLabel =====

describe('makeLabel', () => {
  it('builds a Record<string, string> from ApiSchemaField[]', () => {
    const fields: ApiSchemaField[] = [
      makeSchemaField('nome',    'Beneficiário', 1),
      makeSchemaField('cpf',     'CPF / CNPJ',   2),
      makeSchemaField('destino', 'Operadora',     3),
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
    const fields: ApiSchemaField[] = [
      makeSchemaField('cpf', 'Cadastro de Pessoa Física', 1),
    ];
    const label = makeLabel(fields);
    expect(label['cpf']).toBe('Cadastro de Pessoa Física');
    expect(label['cpf']).not.toBe('cpf');
  });
});

// ===== resolveInputType =====

describe('resolveInputType', () => {
  it("maps 'date' to 'date'", () => {
    expect(resolveInputType('date')).toBe('date');
  });

  it("maps 'datetime' to 'datetime-local'", () => {
    expect(resolveInputType('datetime')).toBe('datetime-local');
  });

  it("maps 'text' to 'text'", () => {
    expect(resolveInputType('text')).toBe('text');
  });

  it("maps 'cpf' to 'text'", () => {
    expect(resolveInputType('cpf')).toBe('text');
  });

  it("maps 'cnpj' to 'text'", () => {
    expect(resolveInputType('cnpj')).toBe('text');
  });

  it("maps 'numeric' to 'text'", () => {
    expect(resolveInputType('numeric')).toBe('text');
  });

  it("maps unknown dataType to 'text'", () => {
    expect(resolveInputType('enum')).toBe('text');
    expect(resolveInputType('')).toBe('text');
    expect(resolveInputType('anything')).toBe('text');
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
