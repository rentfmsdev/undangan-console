export type TemplateTheme = {
  id: string;
  label: string;
  colors: { background: string; surface: string; primary: string; accent: string; text: string; dark: string; rich: string; mid: string; cream: string; border: string; muted: string };
  fonts: { display: string; heading: string; body: string };
};

export type TemplateEditorField = {
  key: string;
  label: string;
  control: "text" | "textarea" | "url" | "datetime-local";
  rows?: number;
};

export type TemplateSection = {
  type: string;
  label: string;
  description: string;
  required: boolean;
  reorderable: boolean;
  maxInstances: number;
  fields?: TemplateEditorField[];
  capabilities?: { backgroundColor?: boolean; backgroundImage?: boolean; image?: boolean; gallery?: boolean; map?: boolean; textStyle?: boolean };
  defaultData: { title: string; subtitle?: string; imageLabel?: string; imageUrl?: string; imageUrls?: string[]; backgroundColor?: string; [key: string]: unknown };
};

export type TemplateKit = {
  id: string;
  code: string;
  version: number;
  category: "wedding" | "birthday" | "khitanan" | "aqiqah";
  name: string;
  description: string;
  price?: number;
  themes: TemplateTheme[];
  sections: TemplateSection[];
  defaultSections: string[];
  navigation: {
    scrollRootSelector: string;
    sectionAttribute: string;
    openingSectionId: string | null;
  };
};

export type TemplateCatalogCategory = "pernikahan" | "khitanan" | "aqiqah" | "ulang-tahun" | "wisuda" | string;

export type TemplateCatalogItem = {
  id: string;
  code: string;
  name: string;
  category: TemplateCatalogCategory;
  categoryLabel: string;
  description: string;
  price: number;
  rating: number;
  favoriteCount: number;
  releaseDate: string;
  status: "available" | "coming-soon";
  covers: string[];
  themeColors: string[];
  features: string[];
  tags?: string[];
};
