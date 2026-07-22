import * as React from 'react';
import * as ReactDom from 'react-dom';
import { IPropertyPaneField, PropertyPaneFieldType } from '@microsoft/sp-property-pane';
import { SitePicker, ISitePickerProps } from './SitePicker';
import { ISite } from '../services/SiteSearchService';

export interface IPropertyPaneSitePickerProps {
  label: string;
  selectedUrl: string;
  selectedTitle: string;
  search: (query: string) => Promise<ISite[]>;
  onChanged: (url: string, title: string) => void;
}

interface IPropertyPaneSitePickerInternalProps extends IPropertyPaneSitePickerProps {
  key: string;
  onRender: (elem: HTMLElement) => void;
  onDispose: (elem: HTMLElement) => void;
}

/**
 * A custom property-pane field that renders the {@link SitePicker} React control,
 * letting an author search for and select a SharePoint site to pull News from.
 */
export class PropertyPaneSitePicker implements IPropertyPaneField<IPropertyPaneSitePickerInternalProps> {
  public type: PropertyPaneFieldType = PropertyPaneFieldType.Custom;
  public targetProperty: string;
  public properties: IPropertyPaneSitePickerInternalProps;

  constructor(targetProperty: string, props: IPropertyPaneSitePickerProps) {
    this.targetProperty = targetProperty;
    this.properties = {
      key: targetProperty,
      label: props.label,
      selectedUrl: props.selectedUrl,
      selectedTitle: props.selectedTitle,
      search: props.search,
      onChanged: props.onChanged,
      onRender: this._onRender.bind(this),
      onDispose: this._onDispose.bind(this)
    };
  }

  private _onRender(elem: HTMLElement): void {
    const element: React.ReactElement<ISitePickerProps> = React.createElement(SitePicker, {
      label: this.properties.label,
      selectedUrl: this.properties.selectedUrl,
      selectedTitle: this.properties.selectedTitle,
      search: this.properties.search,
      onChanged: this.properties.onChanged
    });
    ReactDom.render(element, elem);
  }

  private _onDispose(elem: HTMLElement): void {
    ReactDom.unmountComponentAtNode(elem);
  }
}
