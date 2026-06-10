import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      // OpenAI (ChatGPT & SearchGPT)
      {
        userAgent: ['GPTBot', 'OAI-SearchBot'],
        allow: '/',
      },
        // Microsoft (Bingbot & MSNBot)
      {
        userAgent: ['bingbot', 'MSNBot'],
        allow: '/',
      },
      // Perplexity AI
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
      // Anthropic (Claude)
      {
        userAgent: ['anthropic-ai', 'ClaudeBot', 'Claude-Web'],
        allow: '/',
      },
      // Google AI (Gemini / AI Overviews)
      {
        userAgent: 'Google-Extended',
        allow: '/',
      },
      // Cohere
      {
        userAgent: 'cohere-ai',
        allow: '/',
      }
    ],
    sitemap: 'https://stackgap.xyz/sitemap.xml',
  };
}