import { StandardTemplateNavigationAdapter } from "@/templates/navigation/create-standard-navigation-adapter";

export class VerdantVowsNavigationAdapter extends StandardTemplateNavigationAdapter {
  constructor() {
    super({
      sectionIds: [
        "opening-envelope",
        "hero",
        "couple",
        "event",
        "story",
        "gallery",
        "gift",
        "wishes",
        "closing",
      ],
      prepareEvent: "verdant-vows-navigate",
      openingSectionId: "opening-envelope",
    });
  }
}
