import {ElementRef} from '@angular/core';

/**
 * HTML元素的属性Map：key属性名，value属性值
 */
export interface AttrMap {
    [key: string]: string;
}

/**
 * 从HTML元素或元素引用的attributes中获取属性Map。为了在查找时不区分大小写，把属性Map的Key转换为小写。
 *
 * @param element 属性源，HTML元素（HTMLElement）或元素引用（ElementRef）
 */
export function getAttrs(element: HTMLElement | ElementRef): AttrMap {
    const attrs: NamedNodeMap = element instanceof ElementRef ? element.nativeElement.attributes : element.attributes;
    const attrMap: AttrMap = {};
    // 转换原因：https://github.com/Microsoft/TypeScript/issues/2695
    for (const attr of attrs as any as Attr[]) {
        attrMap[attr.name.toLowerCase()] = attr.value;
    }
    return attrMap;
}

/**
 * 获取属性值
 *
 * @param attrMap 属性Map
 * @param attrName 属性名或属性名数组
 */
export function getAttrValue(attrMap: AttrMap, attrName: string | string[]): string | undefined {
    const key = (typeof attrName === 'string') ? attrName : attrName.find(a => attrMap.hasOwnProperty(a.toLowerCase()));
    return (key === undefined) ? undefined : attrMap[key.toLowerCase()];
}

/**
 * 把属性值转换为boolean类型
 *
 * @param attrValue string类型的属性值，属性未定义时为undefined
 * @param defaultValue 属性未定义时的默认值，默认为false
 */
export function boolFromValue(attrValue: string | undefined, defaultValue: boolean = false) {
    return attrValue === undefined ? defaultValue : attrValue.trim() !== 'false';
}

/**
 * 获取boolean类型的属性值
 *
 * @param element 属性源，HTML元素（HTMLElement）或元素引用（ElementRef）
 * @param attrName 属性名或属性名数组
 * @param defaultValue 属性未定义时的默认值，默认为false
 */
export function getBoolFromAttribute(element: HTMLElement | ElementRef, attrName: string | string[], defaultValue: boolean = false): boolean {
    return boolFromValue(getAttrValue(getAttrs(element), attrName), defaultValue);
}
