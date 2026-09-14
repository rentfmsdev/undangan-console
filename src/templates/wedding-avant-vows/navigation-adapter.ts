import { StandardTemplateNavigationAdapter } from "@/templates/navigation/create-standard-navigation-adapter";

export class AvantVowsNavigationAdapter extends StandardTemplateNavigationAdapter {
  constructor() {
    super({
      sectionIds: ["opening-envelope", "hero", "couple", "event", "story", "gallery", "gift", "wishes", "closing"],
      prepareEvent: "avant-vows-navigate",
      openingSectionId: "opening-envelope",
    });
  }
}
