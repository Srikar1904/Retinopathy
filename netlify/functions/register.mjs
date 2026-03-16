import { getStore } from "@netlify/blobs";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { name, email, phone, password } = await req.json();

    const users = getStore("users");

    // Check if user already exists
    const existing = await users.get(email, { type: "json" });
    if (existing) {
      return new Response(JSON.stringify({ message: "User already exists" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Save user
    await users.setJSON(email, { name, email, phone, password });

    return new Response(
      JSON.stringify({ message: "User registered successfully" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ message: "Registration failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
