import { escapeHtml, escapeJsonForScript } from '../../utils/html';

describe('escapeHtml', () => {
  it('escapuje &', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapuje <', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
  });

  it('escapuje >', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapuje "', () => {
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
  });

  it("escapuje '", () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('zwraca pusty string dla null', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('zwraca pusty string dla undefined', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  it('konwertuje liczby do stringa', () => {
    expect(escapeHtml(42)).toBe('42');
  });

  it('nie zmienia bezpiecznych stringów', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

describe('escapeJsonForScript', () => {
  it('escapuje <', () => {
    const result = escapeJsonForScript({ key: '<value>' });
    expect(result).not.toContain('<value>');
    expect(result).toContain('\\u003c');
  });

  it('escapuje >', () => {
    const result = escapeJsonForScript({ key: '<value>' });
    expect(result).toContain('\\u003e');
  });

  it('escapuje &', () => {
    const result = escapeJsonForScript({ key: 'a&b' });
    expect(result).toContain('\\u0026');
  });

  it('escapuje U+2028', () => {
    const result = escapeJsonForScript({ key: ' ' });
    expect(result).toContain('\\u2028');
    expect(result).not.toContain(' ');
  });

  it('escapuje U+2029', () => {
    const result = escapeJsonForScript({ key: ' ' });
    expect(result).toContain('\\u2029');
    expect(result).not.toContain(' ');
  });

  it('zwraca poprawny JSON', () => {
    const obj = { labels: ['A', 'B'], values: [1, 2] };
    const result = escapeJsonForScript(obj);
    expect(() => JSON.parse(result)).not.toThrow();
    expect(JSON.parse(result)).toEqual(obj);
  });

  it('obsługuje zagnieżdżone obiekty', () => {
    const nested = { a: { b: { c: 'deep' } } };
    const result = escapeJsonForScript(nested);
    expect(JSON.parse(result)).toEqual(nested);
  });
});
