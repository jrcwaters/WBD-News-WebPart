declare interface IHubNewsWebPartStrings {
  PropertyPaneDescription: string;

  DisplayGroupName: string;
  TitleFieldLabel: string;
  LayoutFieldLabel: string;
  LayoutLead: string;
  LayoutGrid: string;
  LayoutCompact: string;

  SourceGroupName: string;
  SourceFieldLabel: string;
  SourceAll: string;
  SourceGrowth: string;
  SourceYou: string;
  SourceCustom: string;
  AudienceFieldLabel: string;
  AudienceFieldDescription: string;
  ItemCountFieldLabel: string;
  UseMockDataFieldLabel: string;
  UseMockDataOn: string;
  UseMockDataOff: string;

  LinkGroupName: string;
  SeeAllTextFieldLabel: string;
  SeeAllUrlFieldLabel: string;
}

declare module 'HubNewsWebPartStrings' {
  const strings: IHubNewsWebPartStrings;
  export = strings;
}
