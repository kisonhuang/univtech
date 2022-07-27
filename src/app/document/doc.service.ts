import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';

import {AsyncSubject, Observable, of} from 'rxjs';
import {catchError, map, switchMap, tap} from 'rxjs/operators';

import {htmlEscape} from 'safevalues';
import {htmlFromStringKnownToSatisfyTypeContract} from 'safevalues/unsafe/reviewed';

import {LogService} from '../base/log.service';
import {LocationService} from '../base/location.service';

import {DocSafe, DocUnsafe} from './doc.model';

export const urlPrefixContent = 'content/';

export const urlPrefixDocs = urlPrefixContent + 'docs/';

export const docNotFoundId = 'doc-not-found';

export const docErrorId = 'doc-error';

const docErrorContent = (docId: string) => htmlFromStringKnownToSatisfyTypeContract(`
    <div class="nf-container l-flex-wrap flex-center">
        <div class="nf-icon material-icons">error_outline</div>
        <div class="nf-response l-flex-wrap center">
            <h1 class="no-toc">文档获取失败</h1>
            <p>无法获取文档，请检查连接稍后再试。${htmlEscape(docId)}</p>
        </div>
    </div>`, '^'
);

@Injectable()
export class DocService {

    // 文档主题映射，key：文档id；value：文档主题
    private docObservableMap = new Map<string, Observable<DocSafe>>();

    // 当前文档主题
    currentDocObservable: Observable<DocSafe>;

    /**
     * 构造函数，创建文档服务
     *
     * @param httpClient HTTP客户端
     * @param logService 日志服务
     * @param locationService 地址服务
     */
    constructor(private httpClient: HttpClient,
                private logService: LogService,
                locationService: LocationService) {
        this.currentDocObservable = locationService.currentPathObservable.pipe(switchMap(currentPath => this.getDoc(currentPath)));
    }

    /**
     * 获取文档
     *
     * @param docPath 文档路径
     * @return 文档主题
     */
    private getDoc(docPath: string): Observable<DocSafe> {
        const docId = docPath || 'index';
        this.logService.log('获取文档：', docId);
        if (!this.docObservableMap.has(docId)) {
            this.docObservableMap.set(docId, this.getDocContent(docId));
        }
        return this.docObservableMap.get(docId) as Observable<DocSafe>;
    }

    /**
     * 获取文档内容
     *
     * @param docId 文档id
     * @return 文档主题
     */
    private getDocContent(docId: string): Observable<DocSafe> {
        const docPath = `${urlPrefixDocs}${convertDocId(docId)}.json`;
        const docSubject = new AsyncSubject<DocSafe>();

        this.logService.log('获取文档：', docPath);
        this.httpClient.get<DocUnsafe>(docPath, {responseType: 'json'})
            .pipe(
                tap(doc => {
                    if (!doc || typeof doc !== 'object') {
                        this.logService.log('文档数据无效：', doc);
                        throw Error('文档数据无效');
                    }
                }),
                map((doc: DocUnsafe) => ({
                    id: doc.id,
                    content: doc.content === null ? null : htmlFromStringKnownToSatisfyTypeContract(doc.content, '^')
                })),
                catchError((response: HttpErrorResponse) =>
                    response.status === 404 ? this.getDocContentNotFound(docId) : this.getDocContentError(docId, response)
                ),
            )
            .subscribe(docSubject);

        return docSubject.asObservable();
    }

    /**
     * 获取文档未找到时的文档内容
     * @param docId 文档id
     * @return 文档主题
     */
    private getDocContentNotFound(docId: string): Observable<DocSafe> {
        if (docId !== docNotFoundId) {
            this.logService.error(new Error(`文档未找到，文档路径：${docId}`));
            return this.getDoc(docNotFoundId);
        } else {
            return of({
                id: docNotFoundId,
                content: htmlEscape('文档未找到')
            });
        }
    }

    /**
     * 获取文档错误时的文档内容
     *
     * @param docId 文档id
     * @param response 错误响应
     * @return 文档主题
     */
    private getDocContentError(docId: string, response: HttpErrorResponse): Observable<DocSafe> {
        this.logService.error(new Error(`文档获取错误，文档路径：${docId}；错误信息：${response.message}`));
        this.docObservableMap.delete(docId);
        return of({
            id: docErrorId,
            content: docErrorContent(docId),
        });
    }

}

/**
 * 转换文档id，在大写字母和`_`后面添加`_`，并把大写字母转换为小写字母
 *
 * @param docId 文档id
 * @return 转换后的文档id
 */
function convertDocId(docId: string): string {
    return docId.replace(/[A-Z_]/g, char => char.toLowerCase() + '_');
}
