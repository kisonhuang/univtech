// 导航节点
export interface NavNode {
    // 节点标题
    title: string;
    // 节点路径
    url?: string;
    // 节点提示
    tooltip?: string;
    // 是否隐藏
    hidden?: boolean;
    // 子节点
    nodes?: NavNode[];
}

//
export type NavResponse = {
    [name: string]: NavNode[];
};

//
export interface NavNodeMap {
    [name: string]: NavNode[];
}

// 当前节点
export interface CurrentNode {
    // 视图：SideNav、TopBar、Footer
    type: string;
    // 路径
    url: string;
    // 祖先节点
    nodes: NavNode[];
}

//
export interface CurrentNodeMap {
    [view: string]: CurrentNode;
}
