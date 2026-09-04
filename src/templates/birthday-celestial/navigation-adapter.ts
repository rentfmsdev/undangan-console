import { StandardTemplateNavigationAdapter } from "@/templates/navigation/create-standard-navigation-adapter";

export class BirthdayCelestialNavigationAdapter extends StandardTemplateNavigationAdapter {
  constructor() {
    super({
      sectionIds: ["opening-envelope", "hero", "event", "gallery", "gift", "wishes", "closing"],
      prepareEvent: "birthday-preview-navigate",
      openingSectionId: "opening-envelope",
    });
  }
}
