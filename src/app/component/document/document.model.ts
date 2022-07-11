/**
 * 安全的文档内容
 */
export interface DocumentSafe {

    /**
     * 文档的唯一标识
     */
    id: string;

    /**
     * 文档查看器中显示的HTML
     */
    contents: TrustedHTML | null;

}

/**
 * 不安全的文档内容
 */
export interface DocumentUnsafe {

    /**
     * 文档的唯一标识
     */
    id: string;

    /**
     * 文档查看器中显示的HTML
     */
    contents: string | null;

}
