import { getStore } from "@netlify/blobs";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ status: "error" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { email, stage, confidence } = await req.json();

    const reports = getStore("reports");

    // Get existing reports for this user
    const existing = await reports.get(email, { type: "json" });
    const userReports = existing || [];

    // Add new report
    userReports.push({
      email,
      stage,
      confidence,
      scan_date: new Date().toISOString(),
    });

    await reports.setJSON(email, userReports);

    return new Response(JSON.stringify({ status: "saved" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: "error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
