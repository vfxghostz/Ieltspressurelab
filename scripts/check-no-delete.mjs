const baseUrl = process.env.IELTS_BASE_URL ?? "http://127.0.0.1:3000";
const email = `delete-test-${Date.now()}@ielts.test`;
const password = "PressureLabDemo1";

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} failed: ${response.status} ${payload.error ?? ""}`);
  }

  return payload;
}

const auth = await request("/api/auth/register", {
  method: "POST",
  body: JSON.stringify({
    email,
    password,
    name: "No Delete Test"
  })
});
const authHeaders = { Authorization: `Bearer ${auth.token}` };

const created = await request("/api/writing/sessions", {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({})
});
const sessionId = created.sessionId;

await request(`/api/writing/sessions/${sessionId}`, {
  method: "PATCH",
  headers: authHeaders,
  body: JSON.stringify({
    text: "one two three four five six seven eight nine ten"
  })
});

const texts = [
  "one two three four five six seven eight nine",
  "one two three four five six seven eight",
  "one two three four five six seven",
  "one two three four five six",
  "one two three four five",
  "one two three four"
];

let lastResult;
for (const [index, text] of texts.entries()) {
  lastResult = await request(`/api/writing/sessions/${sessionId}`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ text })
  });
  console.log(
    `delete ${index + 1}: erasures=${lastResult.session.erasuresUsed}/5 blocked=${lastResult.blockedDeletion} warning=${lastResult.warning ?? "-"} text="${lastResult.session.text}"`
  );
}

if (!lastResult?.blockedDeletion || lastResult.session.erasuresUsed !== 5) {
  throw new Error("No-Delete limit failed");
}

console.log(`PASS no-delete limit: session=${sessionId}`);
