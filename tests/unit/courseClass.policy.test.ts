import { describe, expect, it } from "vitest";
import { canAccessCourseClass } from "../../server/utils/courseClass.policy";

describe("CourseClass policy", () => {
  it("allows public enrollment only while a published class is in setup", () => {
    const setupClass = {
      isPublished: true,
      status: "SETUP",
    } as any;
    const inProgressClass = {
      isPublished: true,
      status: "IN_PROGRESS",
    } as any;

    expect(canAccessCourseClass("PUBLIC_ENROLL", setupClass)).toBe(true);
    expect(canAccessCourseClass("PUBLIC_ENROLL", inProgressClass)).toBe(false);
  });

  it("keeps public browsing separate from public enrollment", () => {
    const inProgressClass = {
      isPublished: true,
      status: "IN_PROGRESS",
    } as any;

    expect(canAccessCourseClass("PUBLIC_BROWSE", inProgressClass)).toBe(true);
  });
});
