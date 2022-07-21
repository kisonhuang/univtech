import * as lunr from 'lunr';

//
export interface SearchResults {
    query: string;
    results: SearchResult[];
}

//
export interface SearchResult {
    path: string;
    title: string;
    type: string;
    titleWords: string;
    keywords: string;
    topics: string;
    deprecated: boolean;
}

//
export interface SearchArea {
    name: string;
    pages: SearchResult[];
    priorityPages: SearchResult[];
}

//
export interface SearchInfo {
    [key: string]: PageInfo;
}

//
export interface PageInfo {
    path: string;
    type: string;
    title: string;
    headings: string;
    keywords: string;
    members: string;
    topics: string;
}

//
export interface EncodedPages {
    dictionary: string;
    pages: EncodedPage[];
}

//
export interface EncodedPage {
    path: string;
    type: string;
    title: string;
    headings: number[];
    keywords: number[];
    members: number[];
    topics: string;
}

//
export type IndexLoader = (indexBuilder: lunr.Builder) => void;
