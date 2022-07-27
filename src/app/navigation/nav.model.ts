//
export interface NavNode {
    title: string;
    url?: string;
    tooltip?: string;
    hidden?: boolean;
    children?: NavNode[];
}

//
export type NavResponse = {
    [name: string]: NavNode[];
};

//
export interface NavNodeMap {
    [name: string]: NavNode[];
}

//
export interface CurrentNode {
    // 路径
    url: string;
    // 视图：SideNav、TopBar、Footer
    view: string;
    // 祖先节点
    nodes: NavNode[];
}

//
export interface CurrentNodeMap {
    [view: string]: CurrentNode;
}
