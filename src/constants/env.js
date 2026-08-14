export const ENV = {
  API_BASE_URL: 'https://yamuna-infra-backend.onrender.com/api',
  API_TIMEOUT_MS: 15000,
  RAZORPAY_KEY: 'rzp_test_PLACEHOLDER',
  GOOGLE_MAPS_KEY: 'PLACEHOLDER',
  USE_MOCK_API: false,

  // NOTE: no LLM keys here. The Vrindavan Companion chatbot calls the backend
  // (`POST /api/ai/chat`), which owns the model key and the RAG pipeline.
  // Anything placed in this file ships inside the APK/AAB and can be extracted,
  // so provider credentials must never live here.
};
