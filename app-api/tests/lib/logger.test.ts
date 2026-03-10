import { logger, httpLogger } from "@/lib/logger";

describe("logger", () => {
  it("should have all log level methods", () => {
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  it("should log without throwing", () => {
    expect(() => logger.info("test info")).not.toThrow();
    expect(() => logger.warn("test warn")).not.toThrow();
    expect(() => logger.error("test error")).not.toThrow();
    expect(() => logger.debug("test debug")).not.toThrow();
  });

  it("should log with metadata without throwing", () => {
    expect(() => logger.info({ requestId: "123" }, "test with meta")).not.toThrow();
  });
});

describe("httpLogger", () => {
  it("should be a function (Express middleware)", () => {
    expect(typeof httpLogger).toBe("function");
  });
});
