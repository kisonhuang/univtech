import * as lunr from 'lunr';

import {WebWorkerMessage} from '../base/worker.service';
import {EncodedPage, EncodedPages, DecodedPage, DecodedPageMap, ResponseHandler, IndexLoader, LunrQueryLexer} from './search.model';

// 搜索数据路径
const searchDataUrl = '/generated/docs/app/search-data.json';

// 索引
let index: lunr.Index;

// 页面映射
const decodedPageMap: DecodedPageMap = {};

// 添加消息事件监听器
addEventListener('message', handleMessage);

/**
 * 处理消息事件
 *
 * @param message 消息
 */
function handleMessage(message: { data: WebWorkerMessage }): void {
    const type = message.data.type;
    const id = message.data.id;
    const payload = message.data.payload;
    switch (type) {
        case 'load-index':
            loadIndex(type, id);
            break;
        case 'query-index':
            postMessage({type, id, payload: {query: payload, results: queryIndex(payload)}});
            break;
        default:
            postMessage({type, id, payload: {error: '消息类型无效'}});
    }
}

/**
 * 加载索引
 *
 * @param type 消息类型
 * @param id 消息id
 */
function loadIndex(type: string, id?: number) {
    sendGetRequest(searchDataUrl, (response: string) => {
        const encodedPages: EncodedPages = JSON.parse(response);
        index = createLunrIndex(encodedPages);
        postMessage({type, id, payload: true});
    });
}

/**
 * 发送GET请求
 *
 * @param url 请求路径
 * @param responseHandler 响应处理器
 */
function sendGetRequest(url: string, responseHandler: ResponseHandler): void {
    const request = new XMLHttpRequest();
    request.onload = function() {
        responseHandler(this.responseText);
    };
    request.open('GET', url);
    request.send();
}

/**
 * 创建lunr索引
 *
 * @param encodedPages 已编码页面
 * @return Index lunr索引
 */
function createLunrIndex(encodedPages: EncodedPages): lunr.Index {
    const indexLoader: IndexLoader = createIndexLoader(encodedPages);
    const queryLexer = (lunr as any as LunrQueryLexer).queryLexer;
    queryLexer.termSeparator = lunr.tokenizer.separator = /\s+/;
    return lunr(function() {
        this.pipeline.remove(lunr.stemmer);
        this.ref('path');
        this.field('topics', {boost: 15});
        this.field('title', {boost: 10});
        this.field('headings', {boost: 5});
        this.field('members', {boost: 4});
        this.field('keywords', {boost: 2});
        indexLoader(this);
    });
}

/**
 * 创建索引加载器
 *
 * @param encodedPages 已编码页面
 * @return IndexLoader 索引加载器
 */
function createIndexLoader(encodedPages: EncodedPages): IndexLoader {
    const dictionaries = encodedPages.dictionary.split(' ');
    return (indexBuilder: lunr.Builder) => {
        encodedPages.pages.forEach(encodedPage => {
            const decodedPage = createDecodedPage(encodedPage, dictionaries);
            indexBuilder.add(decodedPage);
            decodedPageMap[decodedPage.path] = decodedPage;
        });
    };
}

/**
 * 创建已解码页面
 *
 * @param encodedPage 已编码页面
 * @param dictionaries 数据字典
 * @return DecodedPage 已解码页面
 */
function createDecodedPage(encodedPage: EncodedPage, dictionaries: string[]): DecodedPage {
    return {
        ...encodedPage,
        headings: encodedPage.headings?.map(idx => dictionaries[idx]).join(' ') ?? '',
        keywords: encodedPage.keywords?.map(idx => dictionaries[idx]).join(' ') ?? '',
        members: encodedPage.members?.map(idx => dictionaries[idx]).join(' ') ?? '',
    };
}

/**
 * 查询索引
 *
 * @param queryText 查询文本
 * @return DecodedPage[] 已解码页面
 */
function queryIndex(queryText: string): DecodedPage[] {
    queryText = queryText.replace(/^["']|['"]$/g, '');
    try {
        if (queryText.length) {
            const queryTextAll = queryText.replace(/\S+/g, '+$&');
            let results = index.search(queryTextAll);

            if (results.length === 0) {
                results = index.search(queryText);
            }

            if (results.length === 0) {
                const queryTextTitle = 'title:*' + queryText.split(' ', 1)[0] + '*';
                results = index.search(queryText + ' ' + queryTextTitle);
            }

            return results.map(result => decodedPageMap[result.ref]);
        }
    } catch (error) {
        console.error(error);
    }
    return [];
}
