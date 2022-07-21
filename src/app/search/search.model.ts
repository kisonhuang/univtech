import * as lunr from 'lunr';

import {WebWorkerMessage} from '../base/worker.service';

// 查询结果
export interface SearchResults {
    query: string;
    results: SearchResult[];
}

// 查询结果
export interface SearchResult {
    path: string;
    title: string;
    type: string;
    titleWords: string;
    keywords: string;
    topics: string;
    deprecated: boolean;
}

// 查询区域
export interface SearchArea {
    name: string;
    pages: SearchResult[];
    priorityPages: SearchResult[];
}

// 已解码页面映射
export interface DecodedPageMap {
    [key: string]: DecodedPage;
}

// 已解码页面
export interface DecodedPage {
    path: string;
    type: string;
    title: string;
    headings: string;
    keywords: string;
    members: string;
    topics: string;
}

// 已编码页面
export interface EncodedPages {
    dictionary: string;
    pages: EncodedPage[];
}

// 已编码页面
export interface EncodedPage {
    path: string;
    type: string;
    title: string;
    headings: number[];
    keywords: number[];
    members: number[];
    topics: string;
}

// WebWorker消息
export interface Message {
    data: WebWorkerMessage;
}

// lunr查询词法分析器
export interface LunrQueryLexer {
    queryLexer: QueryLexer;
}

// 查询词法分析器
export interface QueryLexer {
    termSeparator: RegExp;
}

// 响应处理器
export type ResponseHandler = (response: string) => void;

// 索引加载器
export type IndexLoader = (indexBuilder: lunr.Builder) => void;
