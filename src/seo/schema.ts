/** JSON-LD structured data output. */
export interface SchemaResult {
  json_ld: string;
}

interface ArticleData {
  title: string;
  description: string;
  url: string;
  date_published: string;
  author_name: string;
  image_url?: string;
}

interface FaqData {
  questions: Array<{ question: string; answer: string }>;
}

interface HowToData {
  name: string;
  steps: Array<{ name: string; text: string }>;
}

function articleSchema(data: ArticleData): object {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.title,
    description: data.description,
    url: data.url,
    datePublished: data.date_published,
    author: { "@type": "Person", name: data.author_name },
    ...(data.image_url && { image: data.image_url }),
  };
}

function faqSchema(data: FaqData): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };
}

function howToSchema(data: HowToData): object {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: data.name,
    step: data.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

/**
 * Generate a JSON-LD structured data block.
 *
 * @param type - One of "article", "faq", or "howto".
 * @param data - Schema-specific data matching the chosen type.
 * @returns Prettified JSON-LD string.
 */
export function generateSchema(
  type: "article" | "faq" | "howto",
  data: ArticleData | FaqData | HowToData
): SchemaResult {
  let schema: object;

  switch (type) {
    case "article":
      schema = articleSchema(data as ArticleData);
      break;
    case "faq":
      schema = faqSchema(data as FaqData);
      break;
    case "howto":
      schema = howToSchema(data as HowToData);
      break;
  }

  return { json_ld: JSON.stringify(schema, null, 2) };
}
