import {SafeHtml} from '@angular/platform-browser';

// 目录项
export interface TocItem {
    // 目录级别
    level: string;
    // 目录链接
    href: string;
    // 目录标题
    title: string;
    // 目录内容
    content: SafeHtml;
    // 是否二级目录
    isSecondary?: boolean;
}
