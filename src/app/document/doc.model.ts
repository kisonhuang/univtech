// 安全的文档内容
export interface DocSafe {
    // 文档id
    id: string;
    // 文档内容
    content: TrustedHTML | null;
}

// 不安全的文档内容
export interface DocUnsafe {
    // 文档id
    id: string;
    // 文档内容
    content: string | null;
}
