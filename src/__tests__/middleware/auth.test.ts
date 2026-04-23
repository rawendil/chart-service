import { Request, Response, NextFunction } from 'express';
import { authenticateApiKey } from '../../middleware/auth';

function mockReq(apiKey?: string) {
  return {
    header: jest.fn((name: string) => (name === 'x-api-key' ? apiKey : undefined)),
    app: { locals: {} },
  } as unknown as Request;
}

function mockRes() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as Response;
  (res.status as jest.Mock).mockReturnValue(res);
  return res;
}

describe('authenticateApiKey', () => {
  it('zwraca 401 gdy brak nagłówka x-api-key', async () => {
    const req = mockReq(undefined);
    const res = mockRes();
    const next = jest.fn() as unknown as NextFunction;

    await authenticateApiKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid or missing API key',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('zwraca 401 gdy błędny klucz', async () => {
    const req = mockReq('wrong-key');
    const res = mockRes();
    const next = jest.fn() as unknown as NextFunction;

    await authenticateApiKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('wywołuje next() dla poprawnego klucza API', async () => {
    const req = mockReq('test-api-key-1234567890');
    const res = mockRes();
    const next = jest.fn() as unknown as NextFunction;

    await authenticateApiKey(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });
});
