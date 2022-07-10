import {htmlFromStringKnownToSatisfyTypeContract} from 'safevalues/unsafe/reviewed';

/**
 * 把元素的innerHTML转换为TrustedHTML
 *
 * @param el 元素：Element
 */
export function fromInnerHTML(el: Element): TrustedHTML {
    // 安全性：现有innerHTML内容已经可信
    // 执行unchecked转换，把满足TrustedHTML类型约束的字符串转换为TrustedHTML
    return htmlFromStringKnownToSatisfyTypeContract(el.innerHTML, '^');
}

/**
 * 把元素的outerHTML转换为TrustedHTML
 *
 * @param el 元素：Element
 */
export function fromOuterHTML(el: Element): TrustedHTML {
    // 安全性：现有outerHTML内容已经可信
    // 执行unchecked转换，把满足TrustedHTML类型约束的字符串转换为TrustedHTML
    return htmlFromStringKnownToSatisfyTypeContract(el.outerHTML, '^');
}

/**
 * 把SVG常量转换为TrustedHTML
 *
 * @param constantSvg 模板字符串数组：TemplateStringsArray
 */
export function fromSvg(constantSvg: TemplateStringsArray): TrustedHTML {
    // 安全性：没有插值的模板字符参数是常量，因此可信
    // 执行unchecked转换，把满足TrustedHTML类型约束的字符串转换为TrustedHTML
    return htmlFromStringKnownToSatisfyTypeContract(constantSvg[0], '^');
}
