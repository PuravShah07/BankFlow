const API_BASE = import.meta.env.VITE_API_BASE || "/api";


// req to backend 
async function request(endpoint, options = {}) {
  const token = localStorage.getItem("bankflow_token");

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}


/* Auth */

// register user
export async function registerUser({ email, name, password }) {
  const data = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, name, password }),
  });

  if (data.token) {
    localStorage.setItem("bankflow_token", data.token);
  }

  return data;
}


// login user
export async function loginUser({ email, password }) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data.token) {
    localStorage.setItem("bankflow_token", data.token);
  }

  return data;
}


// logout user
export async function logoutUser() {
  await request("/auth/logout", {
    method: "POST",
  });

  localStorage.removeItem("bankflow_token");
}