export default defineEventHandler(async (event) => {
  deleteCookie(event, "session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });

  return { success: true };
});
