import {ElementRef} from '@angular/core';

export interface AttrMap {
    [key: string]: string;
}

export function getAttrMap(element: HTMLElement | ElementRef): AttrMap {
    const attrs: NamedNodeMap = element instanceof ElementRef ? element.nativeElement.attributes : element.attributes;
    const attrMap: AttrMap = {};
    for (const attr of attrs as any as Attr[]) {
        attrMap[attr.name.toLowerCase()] = attr.value;
    }
    return attrMap;
}

export function getAttrValue(attrMap: AttrMap, attrNames: string | string[]): string | undefined {
    const key = (typeof attrNames === 'string') ? attrNames : attrNames.find(attrName => attrMap.hasOwnProperty(attrName.toLowerCase()));
    return (key === undefined) ? undefined : attrMap[key.toLowerCase()];
}

export function getAttrValueOfBool(element: HTMLElement | ElementRef, attrNames: string | string[], defaultValue: boolean = false): boolean {
    return convertValueToBool(getAttrValue(getAttrMap(element), attrNames), defaultValue);
}

export function convertValueToBool(attrValue: string | undefined, defaultValue: boolean = false) {
    return attrValue === undefined ? defaultValue : attrValue.trim() !== 'false';
}
