import {htmlFromStringKnownToSatisfyTypeContract} from 'safevalues/unsafe/reviewed';

export function convertInnerHTML(element: Element): TrustedHTML {
    return htmlFromStringKnownToSatisfyTypeContract(element.innerHTML, '^');
}

export function convertOuterHTML(element: Element): TrustedHTML {
    return htmlFromStringKnownToSatisfyTypeContract(element.outerHTML, '^');
}

export function convertSvgTemplate(svgTemplates: TemplateStringsArray): TrustedHTML {
    return htmlFromStringKnownToSatisfyTypeContract(svgTemplates[0], '^');
}
