import {SafeHtml} from '@angular/platform-browser';

// 目录项
export interface TocItem {
    level: string;         // 目录级别
    href: string;          // 目录链接
    title: string;         // 目录标题
    content: SafeHtml;     // 目录内容
    isSecondary?: boolean; // 是否二级目录
}
