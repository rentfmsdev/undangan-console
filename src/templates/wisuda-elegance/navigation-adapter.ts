import { StandardTemplateNavigationAdapter } from "@/templates/navigation/create-standard-navigation-adapter";

export class WisudaNavigationAdapter extends StandardTemplateNavigationAdapter {
  constructor() {
    super({
      sectionIds: [
        "opening-envelope",
        "hero",
        "quote",
        "profile",
        "event",
        "gallery",
        "gift",
        "wishes",
        "closing",
      ],
      prepareEvent: "wisuda-preview-navigate",
      openingSectionId: "opening-envelope",
    });
  }
}
