export async function fetchCurrentUser() {
  return await fetch("/api/user/getCurrentUser").then((res) => res.json());
}
