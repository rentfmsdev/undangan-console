export type EditablePreviewSection = {
  id: string;
  type: string;
  enabled: boolean;
  data: { title: string; subtitle?: string; imageLabel?: string; imageUrl?: string; imageUrls?: string[]; backgroundColor?: string; [key: string]: unknown };
};
