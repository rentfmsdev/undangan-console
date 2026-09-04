import { StandardTemplateNavigationAdapter } from "@/templates/navigation/create-standard-navigation-adapter";

export class AqiqahLittleBloomNavigationAdapter extends StandardTemplateNavigationAdapter {
  constructor() {
    super({
      sectionIds: [
        "opening-envelope",
        "hero",
        "prayer",
        "profile",
        "event",
        "gallery",
        "gift",
        "wishes",
        "closing",
      ],
      prepareEvent: "aqiqah-preview-navigate",
      openingSectionId: "opening-envelope",
    });
  }
}
