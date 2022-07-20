/**
 * 代码选项卡
 */
export interface CodeTab {
    class: string;         // 样式
    codeHtml: TrustedHTML; // 代码HTML，视图中显示的当前输入的已格式化代码
    header?: string;       // 代码标题，显示在代码上方
    language?: string;     // 代码语言：javascript、typescript
    linenum?: string;      // 是否显示行号，number或'number'：从这个数字开始显示行号，true或'true'：显示行号，false或'false'：不显示行号
    path: string;          // 代码路径
    region: string;        // 代码显示区域
}
