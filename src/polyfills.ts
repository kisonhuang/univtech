/**
 * 这个文件包含Angular所需的，在应用程序之前加载的腻子脚本。
 * 可以在这个文件中添加其他腻子脚本。
 *
 * 这个文件分成两个部分：
 * 1、浏览器腻子脚本：ZoneJS加载之前应用，按浏览器排序的脚本。
 * 2、应用程序导入文件：ZoneJS之后导入，main文件之前加载的文件。
 *
 * 当前设置针对于所谓的长青浏览器，它们会自动更新浏览器的最后一个版本。
 * 这些浏览器包括：Safari >= 10、Chrome >= 55（包括Opera）、桌面设备的Edge >= 13、移动设备的iOS 10和Chrome。
 *
 * 了解更多：https://angular.io/guide/browser-support
 */

/***************************************************************************************************
 * 浏览器腻子脚本：ZoneJS加载之前应用，按浏览器排序的脚本。
 *
 * 默认情况下，zone.js会修正所有可能的宏任务和Dom事件。
 * 通过设置以下标记，用户可以禁止修正部分宏任务或Dom事件。
 * 因为需要在加载zone.js之前设置这些标记，并且webpack会把import放在包的顶部，
 * 所以用户需要在这个目录中创建一个单独的文件zone-flags.ts，并在这个文件中放入以下标记，然后在`import 'zone.js';`之前添加以下代码：
 * import './zone-flags';
 *
 * zone-flags.ts中允许的标记如下：
 * 1、以下标记适用于所有浏览器：
 * (window as any).__Zone_disable_requestAnimationFrame = true;               // 禁止修正requestAnimationFrame
 * (window as any).__Zone_disable_on_property = true;                         // 禁止修正onProperty，例如：onclick
 * (window as any).__zone_symbol__UNPATCHED_EVENTS = ['scroll', 'mousemove']; // 禁止修正特定事件
 * 2、IE或Edge开发工具中，zone.js会使用以下标记来包装addEventListener，这样会绕过zone.js对IE或Edge的修正
 * (window as any).__Zone_enable_cross_context_check = true;
 */
// import './zone-flags'; // 导入zone-flags.ts

/***************************************************************************************************
 * Angular默认需要zone.js
 */
import 'zone.js';      // 导入zone.js

/***************************************************************************************************
 * 应用程序导入文件：ZoneJS之后导入，main文件之前加载的文件。
 */
// import 'import file';  // 导入应用程序所需文件
