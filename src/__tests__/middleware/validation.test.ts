import { Request, Response, NextFunction } from 'express';
import {
  generateChartSchema,
  updateChartSchema,
  validateBody,
} from '../../middleware/validation';

function mockReq(body: unknown) {
  return { body, app: { locals: {} } } as unknown as Request;
}

function mockRes() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as Response;
  (res.status as jest.Mock).mockReturnValue(res);
  return res;
}

const validDataset = {
  label: 'ds1',
  data: [1, 2, 3],
};

const validMinimalPayload = {
  chartType: 'bar',
  data: { labels: ['A', 'B', 'C'], datasets: [validDataset] },
};

describe('generateChartSchema', () => {
  it('akceptuje minimalny poprawny payload', () => {
    const result = generateChartSchema.safeParse(validMinimalPayload);
    expect(result.success).toBe(true);
  });

  it('stosuje domyślne wartości width=800, height=600, theme=light, isPublic=false', () => {
    const result = generateChartSchema.safeParse(validMinimalPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.width).toBe(800);
      expect(result.data.height).toBe(600);
      expect(result.data.theme).toBe('light');
      expect(result.data.isPublic).toBe(false);
    }
  });

  it('akceptuje pełny payload ze wszystkimi opcjonalnymi polami', () => {
    const full = {
      ...validMinimalPayload,
      title: 'My Chart',
      description: 'A description',
      width: 1200,
      height: 900,
      theme: 'dark',
      isPublic: true,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
    const result = generateChartSchema.safeParse(full);
    expect(result.success).toBe(true);
  });

  it('odrzuca brak chartType', () => {
    const { chartType: _, ...rest } = validMinimalPayload;
    const result = generateChartSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('odrzuca brak data', () => {
    const { data: _, ...rest } = validMinimalPayload;
    const result = generateChartSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('odrzuca pustą tablicę datasets', () => {
    const payload = { ...validMinimalPayload, data: { labels: [], datasets: [] } };
    const result = generateChartSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('odrzuca width < 100', () => {
    const result = generateChartSchema.safeParse({ ...validMinimalPayload, width: 50 });
    expect(result.success).toBe(false);
  });

  it('odrzuca width > 4000', () => {
    const result = generateChartSchema.safeParse({ ...validMinimalPayload, width: 5000 });
    expect(result.success).toBe(false);
  });

  it('odrzuca expiresAt w przeszłości', () => {
    const result = generateChartSchema.safeParse({
      ...validMinimalPayload,
      expiresAt: new Date(Date.now() - 10000).toISOString(),
    });
    expect(result.success).toBe(false);
  });
});

describe('updateChartSchema', () => {
  it('akceptuje payload z jednym polem', () => {
    const result = updateChartSchema.safeParse({ title: 'New title' });
    expect(result.success).toBe(true);
  });

  it('odrzuca pusty obiekt', () => {
    const result = updateChartSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('odrzuca width poza zakresem', () => {
    const result = updateChartSchema.safeParse({ width: 99 });
    expect(result.success).toBe(false);
  });
});

describe('validateBody middleware', () => {
  it('wywołuje next() dla poprawnych danych', () => {
    const req = mockReq(validMinimalPayload);
    const res = mockRes();
    const next = jest.fn() as unknown as NextFunction;

    validateBody(generateChartSchema)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('zwraca 400 z details dla niepoprawnych danych', () => {
    const req = mockReq({ chartType: 'bar' }); // brak data
    const res = mockRes();
    const next = jest.fn() as unknown as NextFunction;

    validateBody(generateChartSchema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        details: expect.arrayContaining([
          expect.objectContaining({ field: expect.any(String), message: expect.any(String) }),
        ]),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('nadpisuje req.body sparsowanymi danymi z defaultami Zod', () => {
    const req = mockReq(validMinimalPayload);
    const res = mockRes();
    const next = jest.fn() as unknown as NextFunction;

    validateBody(generateChartSchema)(req, res, next);

    expect((req as unknown as Record<string, unknown>).body).toMatchObject({
      width: 800,
      height: 600,
      theme: 'light',
    });
  });
});
