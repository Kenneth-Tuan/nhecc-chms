import { describe, it, expect } from "vitest";
import { paginateArray } from "../../server/utils/helpers";

describe("paginateArray", () => {
  const items = [1, 2, 3, 4, 5];

  it("returns a page slice when pageSize > 0", () => {
    const result = paginateArray(items, 2, 2);
    expect(result.data).toEqual([3, 4]);
    expect(result.pagination).toEqual({
      page: 2,
      pageSize: 2,
      totalItems: 5,
      totalPages: 3,
    });
  });

  it("returns all items when pageSize is 0", () => {
    const result = paginateArray(items, 99, 0);
    expect(result.data).toEqual(items);
    expect(result.pagination).toEqual({
      page: 1,
      pageSize: 0,
      totalItems: 5,
      totalPages: 1,
    });
  });

  it("returns empty data with totalPages 0 when pageSize is 0 and no items", () => {
    const result = paginateArray([], 1, 0);
    expect(result.data).toEqual([]);
    expect(result.pagination.totalPages).toBe(0);
  });
});
