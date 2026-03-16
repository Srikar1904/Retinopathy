import { getStore } from "@netlify/blobs";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ status: "error" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { email, password } = await req.json();

    const users = getStore("users");
    const user = await users.get(email, { type: "json" });

    if (user && user.password === password) {
      return new Response(
        JSON.stringify({ status: "success", name: user.name }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ status: "fail" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: "error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
