export async function POST() {
  return new Response(JSON.stringify({ success: true, message: "Stream stopped." }), { headers: { "content-type": "application/json" } });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "http://localhost:3000",
      "access-control-allow-methods": "GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD",
      "access-control-allow-headers": "Content-Type, Authorization, x-run-id, x-resumable-stream-id, Accept",
      "access-control-expose-headers": "x-run-id, x-resumable-stream-id",
    },
  });
}
