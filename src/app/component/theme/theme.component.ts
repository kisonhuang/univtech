import {DOCUMENT} from '@angular/common';
import {Component, Inject} from '@angular/core';

import {LocalStorageToken} from '../../base/storage.service';

export const StorageKeyTheme = 'storage-key-theme';

@Component({
    selector: 'univ-theme',
    templateUrl: 'theme.component.html'
})
export class ThemeComponent {

    isDark = false;

    constructor(@Inject(DOCUMENT) private document: Document,
                @Inject(LocalStorageToken) private storage: Storage) {
        this.initializeThemeFromPreferences();
    }

    private initializeThemeFromPreferences(): void {
        const storedPreference = this.storage.getItem(StorageKeyTheme);
        if (storedPreference) {
            this.isDark = storedPreference === 'true';
        } else {
            this.isDark = matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
        }

        const initialTheme = this.document.querySelector('#univ-initial-theme');
        if (initialTheme) {
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

    toggleTheme(): void {
        this.isDark = !this.isDark;
        this.updateRenderedTheme();
    }

    private updateRenderedTheme(): void {
        const themeLinkElement = this.document.getElementById('univ-theme-link') as HTMLLinkElement | null;
        if (themeLinkElement) {
            themeLinkElement.href = `${this.getThemeName()}-theme.css`;
        }
        this.storage.setItem(StorageKeyTheme, String(this.isDark));
    }

}
