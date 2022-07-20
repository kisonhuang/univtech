export interface NavigationNode {
    hidden?: boolean;
    title: string;
    tooltip?: string;
    url?: string;
    children?: NavigationNode[];
}

export type NavigationResponse = { [name: string]: NavigationNode[] };

export interface NavigationViews {
    [name: string]: NavigationNode[];
}

export interface CurrentNode {
    url: string;
    view: string;
    nodes: NavigationNode[];
}

export interface CurrentNodes {
    [view: string]: CurrentNode;
}
