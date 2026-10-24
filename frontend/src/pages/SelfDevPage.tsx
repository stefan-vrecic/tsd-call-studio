import html from '../data/selfdev.html?raw';

// 🌱 Development: your own notes on sales targets and self development -- plain text you wrote, kept as-is in data/selfdev.html.
export function SelfDevPage() {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
