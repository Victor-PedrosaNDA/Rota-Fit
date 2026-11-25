import { greetingForHour } from '@/utils/greeting';

describe('greetingForHour', () => {
  it('returns "Boa madrugada" from 0 to 4', () => {
    expect(greetingForHour(0)).toBe('Boa madrugada');
    expect(greetingForHour(4)).toBe('Boa madrugada');
  });

  it('returns "Bom dia" from 5 to 11', () => {
    expect(greetingForHour(5)).toBe('Bom dia');
    expect(greetingForHour(11)).toBe('Bom dia');
  });

  it('returns "Boa tarde" from 12 to 17', () => {
    expect(greetingForHour(12)).toBe('Boa tarde');
    expect(greetingForHour(17)).toBe('Boa tarde');
  });

  it('returns "Boa noite" from 18 to 23', () => {
    expect(greetingForHour(18)).toBe('Boa noite');
    expect(greetingForHour(23)).toBe('Boa noite');
  });
});
