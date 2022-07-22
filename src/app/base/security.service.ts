import {htmlFromStringKnownToSatisfyTypeContract} from 'safevalues/unsafe/reviewed';

/**
 * 把元素的innerHTML转换为TrustedHTML
 *
 * @param element 元素对象
 * @return TrustedHTML 可信任的HTML
 */
export function convertInnerHTML(element: Element): TrustedHTML {
    // 安全性：现有innerHTML内容已经可信
    // 执行unchecked转换，把满足TrustedHTML类型约束的字符串转换为TrustedHTML
    return htmlFromStringKnownToSatisfyTypeContract(element.innerHTML, '^');
}

/**
 * 把元素的outerHTML转换为TrustedHTML
 *
 * @param element 元素对象
 * @return TrustedHTML 可信任的HTML
 */
export function convertOuterHTML(element: Element): TrustedHTML {
    // 安全性：现有outerHTML内容已经可信
    // 执行unchecked转换，把满足TrustedHTML类型约束的字符串转换为TrustedHTML
    return htmlFromStringKnownToSatisfyTypeContract(element.outerHTML, '^');
}

/**
 * 把svg模板转换为TrustedHTML
 *
 * @param svgTemplates svg模板数组
 * @return TrustedHTML 可信任的HTML
 */
export function convertSvgTemplate(svgTemplates: TemplateStringsArray): TrustedHTML {
    // 安全性：没有插值的svg模板是常量，因此可信
    // 执行unchecked转换，把满足TrustedHTML类型约束的字符串转换为TrustedHTML
    return htmlFromStringKnownToSatisfyTypeContract(svgTemplates[0], '^');
}
