import { getStore } from "@netlify/blobs";

export default async (req) => {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const reports = getStore("reports");
    const userReports = await reports.get(email, { type: "json" });

    // Return sorted by date descending
    const sorted = (userReports || []).sort(
      (a, b) => new Date(b.scan_date) - new Date(a.scan_date)
    );

    return new Response(JSON.stringify(sorted), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
