import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';

import {AsyncSubject, Observable, of} from 'rxjs';
import {catchError, map, switchMap, tap} from 'rxjs/operators';

import {htmlEscape} from 'safevalues';
import {htmlFromStringKnownToSatisfyTypeContract} from 'safevalues/unsafe/reviewed';

import {LogService} from '../base/log.service';
import {LocationService} from '../base/location.service';

import {DocumentSafe, DocumentUnsafe} from './document.model';

export const UrlPrefixContent = 'content/';

export const UrlPrefixDocs = UrlPrefixContent + 'docs/';

export const DocNotFoundId = 'file-not-found';

export const DocFetchErrorId = 'doc-fetch-error';

const docFetchErrorContent = (path: string) => htmlFromStringKnownToSatisfyTypeContract(`
    <div class="nf-container l-flex-wrap flex-center">
        <div class="nf-icon material-icons">error_outline</div>
        <div class="nf-response l-flex-wrap center">
            <h1 class="no-toc">请求文档失败</h1>
            <p>无法获取${htmlEscape(path)}页面，请检查连接，稍后再试。</p>
        </div>
    </div>`, ''
);

@Injectable()
export class DocService {

    private docMap = new Map<string, Observable<DocumentSafe>>();

    currentDocument: Observable<DocumentSafe>;

    constructor(private httpClient: HttpClient,
                private logService: LogService,
                location: LocationService) {
        this.currentDocument = location.currentPathObservable.pipe(switchMap(path => this.getDocument(path)));
    }

    private getDocument(url: string) {
        const id = url || 'index';
        this.logService.log('获取文档：', id);
        if (!this.docMap.has(id)) {
            this.docMap.set(id, this.fetchDocument(id));
        }
        return this.docMap.get(id) as Observable<DocumentSafe>;
    }

    private fetchDocument(id: string): Observable<DocumentSafe> {
        const requestPath = `${UrlPrefixDocs}${encodeToLowerCase(id)}.json`;
        const subject = new AsyncSubject<DocumentSafe>();

        this.logService.log('获取文档：', requestPath);
        this.httpClient.get<DocumentUnsafe>(requestPath, {responseType: 'json'})
            .pipe(
                tap(data => {
                    if (!data || typeof data !== 'object') {
                        this.logService.log('接受到无效数据：', data);
                        throw Error('无效数据');
                    }
                }),
                map((doc: DocumentUnsafe) => ({
                    id: doc.id,
                    contents: doc.contents === null ? null : htmlFromStringKnownToSatisfyTypeContract(doc.contents, '^')
                })),
                catchError((error: HttpErrorResponse) =>
                    error.status === 404 ? this.getFileNotFoundDoc(id) : this.getErrorDoc(id, error)
                ),
            )
            .subscribe(subject);

        return subject.asObservable();
    }

    private getFileNotFoundDoc(id: string): Observable<DocumentSafe> {
        if (DocNotFoundId !== id) {
            this.logService.error(new Error(`文档'${id}'未找到`));
            return this.getDocument(DocNotFoundId);
        } else {
            return of({
                id: DocNotFoundId,
                contents: htmlEscape('文档未找到')
            });
        }
    }

    private getErrorDoc(id: string, error: HttpErrorResponse): Observable<DocumentSafe> {
        this.logService.error(new Error(`文档'${id}'获取错误：(${error.message})`));
        this.docMap.delete(id);
        return of({
            id: DocFetchErrorId,
            contents: docFetchErrorContent(id),
        });
    }

}

function encodeToLowerCase(str: string): string {
    return str.replace(/[A-Z_]/g, char => char.toLowerCase() + '_');
}
