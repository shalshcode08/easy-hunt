export const addExtra = jest.fn().mockReturnValue({
  use: jest.fn(),
  launch: jest.fn().mockResolvedValue({
    newContext: jest.fn().mockResolvedValue({
      newPage: jest.fn().mockResolvedValue({
        goto: jest.fn(),
        waitForSelector: jest.fn(),
        $$: jest.fn().mockResolvedValue([]),
        $: jest.fn().mockResolvedValue(null),
        $eval: jest.fn(),
        close: jest.fn(),
      }),
      close: jest.fn(),
    }),
    close: jest.fn(),
    on: jest.fn(),
  }),
});
