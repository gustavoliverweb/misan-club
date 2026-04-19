import { describe, it, expect } from "vitest";
import { AutofacturaService } from "../../core/services/autofactura.service";

const service = new AutofacturaService();

const baseInput = {
  commissionId: crypto.randomUUID(),
  emisorId: crypto.randomUUID(),
  emisorName: "Juan Pérez",
  amount: 5,
};

describe("AutofacturaService.build", () => {
  it("sets fixed receptor and concepto per Spec 04", () => {
    const result = service.build(baseInput);
    expect(result.receptorName).toBe("MisanClub");
    expect(result.concepto).toBe("Servicios de intermediación comercial");
  });

  it("passes through emisor and commission data", () => {
    const result = service.build(baseInput);
    expect(result.emisorId).toBe(baseInput.emisorId);
    expect(result.emisorName).toBe(baseInput.emisorName);
    expect(result.commissionId).toBe(baseInput.commissionId);
    expect(result.amount).toBe(5);
    expect(result.currency).toBe("EUR");
  });

  it("generates a unique id each call", () => {
    const a = service.build(baseInput);
    const b = service.build(baseInput);
    expect(a.id).not.toBe(b.id);
  });

  it("uses provided issuedAt when given", () => {
    const date = new Date("2026-04-01T00:00:00Z");
    const result = service.build({ ...baseInput, issuedAt: date });
    expect(result.issuedAt).toEqual(date);
  });

  it("defaults issuedAt to now when omitted", () => {
    const before = new Date();
    const result = service.build(baseInput);
    const after = new Date();
    expect(result.issuedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.issuedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("throws on non-positive amount", () => {
    expect(() => service.build({ ...baseInput, amount: 0 })).toThrow();
    expect(() => service.build({ ...baseInput, amount: -5 })).toThrow();
  });

  it("throws on missing emisorName", () => {
    expect(() => service.build({ ...baseInput, emisorName: "" })).toThrow();
  });
});

describe("AutofacturaService.buildS3Key", () => {
  it("produces a structured key with year/month/emisorId/id", () => {
    const key = service.buildS3Key("abc-id", "user-123");
    expect(key).toMatch(/^autofacturas\/\d{4}\/\d{2}\/user-123\/abc-id\.pdf$/);
  });

  it("zero-pads the month", () => {
    const key = service.buildS3Key("id", "user");
    const parts = key.split("/");
    expect(parts[2]).toHaveLength(2);
  });
});
