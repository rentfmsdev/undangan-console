import { StandardTemplateNavigationAdapter } from "@/templates/navigation/create-standard-navigation-adapter";

export class KhitanKsatriaNavigationAdapter extends StandardTemplateNavigationAdapter {
  constructor() {
    super({
      sectionIds: [
      "opening-envelope",
      "hero",
      "profile",
      "event",
      "gallery",
      "gift",
      "wishes",
      "closing",
      ],
      prepareEvent: "khitan-preview-navigate",
      openingSectionId: "opening-envelope",
    });
  }
}
