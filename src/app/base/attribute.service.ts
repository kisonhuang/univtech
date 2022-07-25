import {ElementRef} from '@angular/core';

// 属性映射，key：小写的属性名，value：属性值
export interface AttrMap {
    [key: string]: string;
}

/**
 * 获取属性映射
 *
 * @param element HTML元素或元素引用
 * @return AttrMap 属性映射，key：小写的属性名，value：属性值
 */
export function getAttrMap(element: HTMLElement | ElementRef): AttrMap {
    const attrs: NamedNodeMap = element instanceof ElementRef ? element.nativeElement.attributes : element.attributes;
    const attrMap: AttrMap = {};
    // 转换原因：https://github.com/Microsoft/TypeScript/issues/2695
    for (const attr of attrs as any as Attr[]) {
        attrMap[attr.name.toLowerCase()] = attr.value;
    }
    return attrMap;
}

/**
 * 获取字符串类型的属性值
 *
 * @param attrMap 属性映射
 * @param attrNames 属性名或属性名数组
 * @return string或undefined 字符串类型的属性值，属性未定义时为undefined
 */
export function getAttrValue(attrMap: AttrMap, attrNames: string | string[]): string | undefined {
    const key = (typeof attrNames === 'string') ? attrNames : attrNames.find(attrName => attrMap.hasOwnProperty(attrName.toLowerCase()));
    return (key === undefined) ? undefined : attrMap[key.toLowerCase()];
}

/**
 * 获取布尔类型的属性值
 *
 * @param element HTML元素或元素引用
 * @param attrNames 属性名或属性名数组
 * @param defaultValue 属性未定义时的默认值，默认为false
 * @return boolean 布尔类型的属性值
 */
export function getAttrValueOfBool(element: HTMLElement | ElementRef, attrNames: string | string[], defaultValue: boolean = false): boolean {
    return convertAttrValue(getAttrValue(getAttrMap(element), attrNames), defaultValue);
}

/**
 * 把字符串类型的属性值转换为布尔类型
 *
 * @param attrValue 字符串类型的属性值，属性未定义时为undefined
 * @param defaultValue 属性未定义时的默认值，默认为false
 * @return boolean 布尔类型的属性值
 */
export function convertAttrValue(attrValue: string | undefined, defaultValue: boolean = false): boolean {
    return attrValue === undefined ? defaultValue : attrValue.trim() !== 'false';
}
