import { StandardTemplateNavigationAdapter } from "@/templates/navigation/create-standard-navigation-adapter";

export class EternalOrbitNavigationAdapter extends StandardTemplateNavigationAdapter {
  constructor() {
    super({
      sectionIds: ["opening-envelope", "hero", "couple", "event", "story", "gallery", "gift", "wishes", "closing"],
      prepareEvent: "eternal-orbit-navigate",
      openingSectionId: "opening-envelope",
    });
  }
}
