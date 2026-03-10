export const PgBoss = jest.fn().mockImplementation(() => ({
  on: jest.fn(),
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  work: jest.fn().mockResolvedValue("worker-id"),
  send: jest.fn().mockResolvedValue("job-id"),
  schedule: jest.fn().mockResolvedValue(undefined),
}));
