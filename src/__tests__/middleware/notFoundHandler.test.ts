import { Request, Response, NextFunction } from 'express';
import { notFoundHandler } from '../../middleware/notFoundHandler';

function mockReq(url = '/not/found') {
  return {
    originalUrl: url,
    app: { locals: {} },
  } as unknown as Request;
}

function mockRes() {
  return {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as Response;
}

describe('notFoundHandler', () => {
  it('wywołuje next z błędem 404', () => {
    const next = jest.fn() as unknown as NextFunction;
    notFoundHandler(mockReq(), mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });

  it('komunikat błędu zawiera originalUrl', () => {
    const next = jest.fn() as unknown as NextFunction;
    notFoundHandler(mockReq('/missing/page'), mockRes(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err.message).toContain('/missing/page');
  });

  it('nie wywołuje res.json bezpośrednio', () => {
    const res = mockRes();
    const next = jest.fn() as unknown as NextFunction;
    notFoundHandler(mockReq(), res, next);

    expect(res.json).not.toHaveBeenCalled();
  });
});
