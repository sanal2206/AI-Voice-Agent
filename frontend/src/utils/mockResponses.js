const AI_RESPONSES = [
  "That's a great question! Our AI-powered platform offers comprehensive solutions tailored to your business needs. Would you like to explore our pricing plans?",
  "I understand your concern. Let me walk you through how our product can specifically address that challenge for you.",
  "Excellent point! Many of our clients have seen a 40% improvement in efficiency within the first month. Are you ready to get started?",
  "I'd love to schedule a demo for you. Our team can show you exactly how this integrates with your existing workflow.",
  "Our enterprise plan includes dedicated support, custom integrations, and onboarding assistance. Does that align with what you're looking for?",
  "That's completely understandable. Can I send you some case studies from similar companies who've benefited from our solution?",
  "We offer a 14-day free trial with no credit card required. Would you like to sign up and experience it firsthand?",
  "Our customers typically see ROI within 3 months. Based on your use case, I believe you'd see results even faster.",
  "I appreciate your time today. Is there anything specific stopping you from moving forward? I'd like to address any concerns.",
  "Perfect! Let me summarize what we discussed and I'll send you a custom proposal based on your requirements.",
];

const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Arabic'];

export function getMockResponse(userMessage) {
  const idx = Math.floor(Math.random() * AI_RESPONSES.length);
  return AI_RESPONSES[idx];
}

export function detectLanguage(text) {
  const hindiChars = /[\u0900-\u097F]/;
  const arabicChars = /[\u0600-\u06FF]/;
  if (hindiChars.test(text)) return 'Hindi';
  if (arabicChars.test(text)) return 'Arabic';
  // Simple heuristic for demo
  return 'English';
}

export function getMockTranscript() {
  const transcripts = [
    "Hello, I'm calling about your software solution.",
    "I heard about your product and I'm interested in learning more.",
    "Can you tell me about the pricing for your enterprise plan?",
    "We're looking for a solution that integrates with our current CRM.",
    "What kind of support do you offer after purchase?",
  ];
  return transcripts[Math.floor(Math.random() * transcripts.length)];
}
