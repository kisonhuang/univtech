import {DOCUMENT} from '@angular/common';
import {Component, Inject} from '@angular/core';

import {LocalStorage} from '../../base/storage.service';

export const storageKeyTheme = 'storage-key-theme';

@Component({
    selector: 'univ-theme',
    templateUrl: 'theme.component.html',
    styleUrls: ['theme.component.scss']
})
export class ThemeComponent {

    // 是否黑暗模式
    isDark = false;

    /**
     * 构造函数，创建主题组件
     *
     * @param document 文档
     * @param storage 存储
     */
    constructor(@Inject(DOCUMENT) private document: Document,
                @Inject(LocalStorage) private storage: Storage) {
        this.initializeThemeFromPreferences();
    }

    private initializeThemeFromPreferences(): void {
        // Check whether there's an explicit preference in localStorage.
        const storedPreference = this.storage.getItem(storageKeyTheme);

        // If we do have a preference in localStorage, use that. Otherwise,
        // initialize based on the prefers-color-scheme media query.
        if (storedPreference) {
            this.isDark = storedPreference === 'true';
        } else {
            this.isDark = matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
        }

        const initialTheme = this.document.querySelector('#aio-initial-theme');
        if (initialTheme) {
            // todo(aleksanderbodurri): change to initialTheme.remove() when ie support is dropped
            initialTheme.parentElement?.removeChild(initialTheme);
        }

        const themeLinkElement = this.document.createElement('link');
        themeLinkElement.id = 'univ-theme-link';
        themeLinkElement.rel = 'stylesheet';
        themeLinkElement.href = `${this.getThemeName()}-theme.css`;
        this.document.head.appendChild(themeLinkElement);
    }

    getThemeName(): string {
        return this.isDark ? 'dark' : 'light';
    }

    getToggleLabel(): string {
        return `切换到${this.isDark ? '明亮' : '黑暗'}模式`;
    }

    /**
     * 切换主题
     */
    toggleTheme(): void {
        this.isDark = !this.isDark;
        this.updateRenderedTheme();
    }

    /**
     * 更新已渲染主题
     */
    private updateRenderedTheme(): void {
        const themeLinkElement = this.document.getElementById('univ-theme-link') as HTMLLinkElement | null;
        if (themeLinkElement) {
            themeLinkElement.href = `${this.getThemeName()}-theme.css`;
        }
        this.storage.setItem(storageKeyTheme, String(this.isDark));
    }
}
