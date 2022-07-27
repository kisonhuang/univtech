import {Component, HostBinding, ViewChild} from '@angular/core';
import {MatSidenav} from '@angular/material/sidenav';


// 左侧导航视图

// 显示顶部菜单的最小宽度
export const showTopMenuWidth = 1150;

// 显示左侧导航的最小宽度
export const dockSideNavWidth = 992;

// 显示右侧目录的最小宽度
export const showFloatingTocWidth = 800;

@Component({
    selector: 'univ-app',
    templateUrl: './app.component.html'
})
export class AppComponent {

    // 用户是否希望减少动画
    static reducedMotion = window.matchMedia('(prefers-reduced-motion)').matches;

    //
    isFetching = false;

    //
    isTransitioning = true;

    // 是否第一次渲染
    private isStarting = true;

    // 第一次渲染，或者用户希望减少动画时，禁用所有Angular动画
    @HostBinding('@.disabled')
    get disableAnimations(): boolean {
        return this.isStarting || AppComponent.reducedMotion;
    }

    @ViewChild(MatSidenav, {static: true})
    sidenav?: MatSidenav;

}
