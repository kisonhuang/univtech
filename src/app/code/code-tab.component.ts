import {AfterViewInit, Component, ElementRef, Input, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';

import {convertInnerHTML} from '../base/security.service';
import {CodeComponent} from './code.component';
import {CodeTab} from './code-tab.model';

/**
 * 代码选项卡组件，使用示例：
 * ```
 * <univ-code-tab>
 *     <univ-code-pane header="" path=""></univ-code-pane>
 *     <univ-code-pane header="" path=""></univ-code-pane>
 * </univ-code-tab>
 *
 * <univ-code-pane>类似于<univ-code-example>
 * ```
 */
@Component({
    selector: 'univ-code-tab',
    templateUrl: './code-tab.component.html',
})
export class CodeTabComponent implements OnInit, AfterViewInit {

    // 代码选项卡
    codeTabs: CodeTab[];

    // 是否显示行号，'number'：从这个数字开始显示行号，'true'：显示行号，'false'：不显示行号
    @Input() linenum: string | undefined;

    // 代码内容
    @ViewChild('content', {static: true}) contentElement: ElementRef<HTMLDivElement>;

    // 代码组件
    @ViewChildren(CodeComponent) codeComponents: QueryList<CodeComponent>;

    /**
     * 数据绑定属性初始化之后的回调方法
     */
    ngOnInit() {
        this.codeTabs = [];
        const contentElement = this.contentElement.nativeElement;
        const codePaneElements = Array.from(contentElement.querySelectorAll('univ-code-pane'));
        contentElement.textContent = '';

        for (const codePaneElement of codePaneElements) {
            this.codeTabs.push(this.buildCodeTab(codePaneElement));
        }
    }

    /**
     * 组件视图初始化完成之后的回调方法
     */
    ngAfterViewInit() {
        this.codeComponents.toArray().forEach((codeComponent, index) => {
            codeComponent.codeHtml = this.codeTabs[index].codeHtml;
        });
    }

    /**
     * 构造代码选项卡
     *
     * @param codePaneElement 代码面板元素
     * @return CodeTab 代码选项卡
     */
    private buildCodeTab(codePaneElement: Element): CodeTab {
        return {
            class: codePaneElement.getAttribute('class') || '',
            codeHtml: convertInnerHTML(codePaneElement),
            header: codePaneElement.getAttribute('header') || undefined,
            language: codePaneElement.getAttribute('language') || undefined,
            linenum: codePaneElement.getAttribute('linenum') || this.linenum,
            path: codePaneElement.getAttribute('path') || '',
            region: codePaneElement.getAttribute('region') || '',
        };
    }

}
