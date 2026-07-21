import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
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

export interface IHubNewsWebPartProps {
  title: string;
  layout: NewsLayout;
  source: NewsSource;
  audience: string;
  itemCount: number;
  seeAllText: string;
  seeAllUrl: string;
  useMockData: boolean;
}

export default class HubNewsWebPart extends BaseClientSideWebPart<IHubNewsWebPartProps> {
  private _mockService: INewsService;
  private _spService: INewsService;

  protected onInit(): Promise<void> {
    this._mockService = new MockNewsService();
    this._spService = new SharePointNewsService(this.context);
    return super.onInit();
  }

  public render(): void {
    const useMock: boolean = this.properties.useMockData !== false;

    const element: React.ReactElement<IHubNewsProps> = React.createElement(HubNews, {
      title: this.properties.title || '',
      layout: this.properties.layout || 'lead',
      source: this.properties.source || 'firmwide',
      audience: this.properties.audience || '',
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
              groupFields: [
                PropertyPaneDropdown('source', {
                  label: strings.SourceFieldLabel,
                  options: [
                    { key: 'firmwide', text: strings.SourceFirmwide },
                    { key: 'office', text: strings.SourceOffice },
                    { key: 'practice', text: strings.SourcePractice },
                    { key: 'custom', text: strings.SourceCustom }
                  ]
                }),
                PropertyPaneTextField('audience', {
                  label: strings.AudienceFieldLabel,
                  description: strings.AudienceFieldDescription
                }),
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
              ]
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
