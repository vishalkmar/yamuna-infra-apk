export const ENV = {
  API_BASE_URL: 'https://yamuna-infra-backend.onrender.com/api',
  API_TIMEOUT_MS: 15000,
  RAZORPAY_KEY: 'rzp_test_PLACEHOLDER',
  GOOGLE_MAPS_KEY: 'PLACEHOLDER',
  USE_MOCK_API: false,

  // ---------------------------------------------------------------------------
  // LLM brain for the Vrindavan Companion chatbot.
  //
  // INTERIM SETUP (see CONTEXT.md "Module 28 — Configurable AI Concierge"):
  // the app calls the NVIDIA NIM (OpenAI-compatible) endpoint DIRECTLY. This
  // ships the API key inside the app build — acceptable only for demo. The
  // permanent design routes chat through the backend with a configurable RAG
  // pipeline so the key never leaves the server.
  //
  // To enable real answers: paste the key from server/.env (LLM_API_KEY) below
  // and keep `enabled: true`. Set `enabled: false` to fall back to the built-in
  // rule-based replies (offline / no key).
  // ---------------------------------------------------------------------------
  LLM: {
    enabled: true,
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    apiKey: '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',
    model: 'meta/llama-3.3-70b-instruct',
    temperature: 0.4,
    maxTokens: 512,
  },
};
