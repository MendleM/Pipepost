/** A generated social media post with platform name and character count. */
export interface SocialPost {
  platform: string;
  content: string;
  char_count: number;
}

/** Input data for social post generation. */
export interface SocialArticleInput {
  title: string;
  summary: string;
  url: string;
}
