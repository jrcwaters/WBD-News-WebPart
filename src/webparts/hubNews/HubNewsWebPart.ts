import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  type IPropertyPaneField,
  PropertyPaneTextField,
  PropertyPaneChoiceGroup,
  PropertyPaneDropdown,
  PropertyPaneSlider,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'HubNewsWebPartStrings';
import HubNews from './components/HubNews';
import { IHubNewsProps, NewsLayout } from './components/IHubNewsProps';
import { NewsSource, INewsService } from './services/INewsService';
import { MockNewsService } from './services/MockNewsService';
import { SharePointNewsService } from './services/SharePointNewsService';
import { SiteSearchService } from './services/SiteSearchService';
import { PropertyPaneSitePicker } from './propertyPane/PropertyPaneSitePicker';

export interface IHubNewsWebPartProps {
  title: string;
  layout: NewsLayout;
  source: NewsSource;
  audience: string;
  selectedSiteUrl: string;
  selectedSiteTitle: string;
  itemCount: number;
  seeAllText: string;
  seeAllUrl: string;
  useMockData: boolean;
}

export default class HubNewsWebPart extends BaseClientSideWebPart<IHubNewsWebPartProps> {
  private _mockService: INewsService;
  private _spService: INewsService;
  private _siteSearch: SiteSearchService;

  protected onInit(): Promise<void> {
    this._mockService = new MockNewsService();
    this._spService = new SharePointNewsService(this.context);
    this._siteSearch = new SiteSearchService(this.context);
    return super.onInit();
  }

  public render(): void {
    const useMock: boolean = this.properties.useMockData !== false;
    const source: NewsSource = this.properties.source || 'all';
    // For the 'picker' source the chosen site URL lives in its own property.
    const audience: string =
      source === 'picker' ? this.properties.selectedSiteUrl || '' : this.properties.audience || '';

    const element: React.ReactElement<IHubNewsProps> = React.createElement(HubNews, {
      title: this.properties.title || '',
      layout: this.properties.layout || 'lead',
      source,
      audience,
      itemCount: this.properties.itemCount || 5,
      seeAllText: this.properties.seeAllText || '',
      seeAllUrl: this.properties.seeAllUrl || '',
      service: useMock ? this._mockService : this._spService,
      dataMode: useMock ? 'sample' : 'sharepoint'
    });

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  // Re-render the property pane when the source changes so the conditional
  // fields (site picker vs. audience text box) show/hide immediately.
  protected onPropertyPaneFieldChanged(propertyPath: string): void {
    if (propertyPath === 'source') {
      this.context.propertyPane.refresh();
    }
  }

  /** Called by the site picker when the author selects (or clears) a site. */
  private _onSiteSelected(url: string, title: string): void {
    this.properties.selectedSiteUrl = url;
    this.properties.selectedSiteTitle = title;
    this.render();
    this.context.propertyPane.refresh();
  }

  private _sourceGroupFields(): IPropertyPaneField<unknown>[] {
    const source: NewsSource = this.properties.source || 'all';

    const fields: IPropertyPaneField<unknown>[] = [
      PropertyPaneDropdown('source', {
        label: strings.SourceFieldLabel,
        options: [
          { key: 'all', text: strings.SourceAll },
          { key: 'growth', text: strings.SourceGrowth },
          { key: 'you', text: strings.SourceYou },
          { key: 'picker', text: strings.SourcePicker },
          { key: 'custom', text: strings.SourceCustom }
        ]
      })
    ];

    if (source === 'picker') {
      fields.push(
        new PropertyPaneSitePicker('selectedSiteUrl', {
          label: strings.SitePickerLabel,
          selectedUrl: this.properties.selectedSiteUrl || '',
          selectedTitle: this.properties.selectedSiteTitle || '',
          search: (query: string) => this._siteSearch.search(query),
          onChanged: (url: string, title: string) => this._onSiteSelected(url, title)
        })
      );
    } else if (source === 'all' || source === 'custom') {
      fields.push(
        PropertyPaneTextField('audience', {
          label: strings.AudienceFieldLabel,
          description: strings.AudienceFieldDescription
        })
      );
    }

    fields.push(
      PropertyPaneSlider('itemCount', {
        label: strings.ItemCountFieldLabel,
        min: 1,
        max: 8,
        step: 1,
        showValue: true
      }),
      PropertyPaneToggle('useMockData', {
        label: strings.UseMockDataFieldLabel,
        onText: strings.UseMockDataOn,
        offText: strings.UseMockDataOff
      })
    );

    return fields;
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.DisplayGroupName,
              groupFields: [
                PropertyPaneTextField('title', {
                  label: strings.TitleFieldLabel
                }),
                PropertyPaneChoiceGroup('layout', {
                  label: strings.LayoutFieldLabel,
                  options: [
                    { key: 'lead', text: strings.LayoutLead, iconProps: { officeFabricIconFontName: 'News' } },
                    { key: 'grid', text: strings.LayoutGrid, iconProps: { officeFabricIconFontName: 'GridViewMedium' } },
                    { key: 'compact', text: strings.LayoutCompact, iconProps: { officeFabricIconFontName: 'BulletedList' } }
                  ]
                })
              ]
            },
            {
              groupName: strings.SourceGroupName,
              groupFields: this._sourceGroupFields()
            },
            {
              groupName: strings.LinkGroupName,
              groupFields: [
                PropertyPaneTextField('seeAllText', {
                  label: strings.SeeAllTextFieldLabel
                }),
                PropertyPaneTextField('seeAllUrl', {
                  label: strings.SeeAllUrlFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
