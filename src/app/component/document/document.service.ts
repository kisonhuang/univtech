import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';

import {AsyncSubject, Observable, of} from 'rxjs';
import {catchError, map, switchMap, tap} from 'rxjs/operators';

import {htmlEscape} from 'safevalues';
import {htmlFromStringKnownToSatisfyTypeContract} from 'safevalues/unsafe/reviewed';

import {Logger} from '../../base/logger.service';
import {LocationService} from '../../base/location.service';

import {DocumentSafe, DocumentUnsafe} from './document.model';

export const FILE_NOT_FOUND_ID = 'file-not-found';

export const FETCHING_ERROR_ID = 'fetching-error';

export const CONTENT_URL_PREFIX = 'generated/';

export const DOC_CONTENT_URL_PREFIX = CONTENT_URL_PREFIX + 'docs/';

const FETCHING_ERROR_CONTENTS = (path: string) => htmlFromStringKnownToSatisfyTypeContract(`
    <div class="nf-container l-flex-wrap flex-center">
        <div class="nf-icon material-icons">error_outline</div>
        <div class="nf-response l-flex-wrap center">
            <h1 class="no-toc">请求文档失败</h1>
            <p>无法获取${htmlEscape(path)}页面，请检查连接，稍后再试。</p>
        </div>
    </div>`, 'inline HTML with interpolations escaped'
);

@Injectable()
export class DocumentService {

    private cache = new Map<string, Observable<DocumentSafe>>();

    currentDocument: Observable<DocumentSafe>;

    constructor(
        private logger: Logger,
        private http: HttpClient,
        location: LocationService) {
        // Whenever the URL changes we try to get the appropriate doc
        this.currentDocument = location.currentPath.pipe(switchMap(path => this.getDocument(path)));
    }

    private getDocument(url: string) {
        const id = url || 'index';
        this.logger.log('getting document', id);
        if (!this.cache.has(id)) {
            this.cache.set(id, this.fetchDocument(id));
        }
        return this.cache.get(id) as Observable<DocumentSafe>;
    }

    private fetchDocument(id: string): Observable<DocumentSafe> {
        const requestPath = `${DOC_CONTENT_URL_PREFIX}${encodeToLowercase(id)}.json`;
        const subject = new AsyncSubject<DocumentSafe>();

        this.logger.log('fetching document from', requestPath);
        this.http.get<DocumentUnsafe>(requestPath, {responseType: 'json'})
            .pipe(
                tap(data => {
                    if (!data || typeof data !== 'object') {
                        this.logger.log('received invalid data:', data);
                        throw Error('Invalid data');
                    }
                }),
                map((data: DocumentUnsafe) => ({
                    id: data.id,
                    contents: data.contents === null ?
                        null :
                        // SECURITY: HTML is authored by the documentation team and is fetched directly
                        // from the server
                        htmlFromStringKnownToSatisfyTypeContract(data.contents, '^')
                })),
                catchError((error: HttpErrorResponse) =>
                    error.status === 404 ? this.getFileNotFoundDoc(id) : this.getErrorDoc(id, error)
                ),
            )
            .subscribe(subject);

        return subject.asObservable();
    }

    private getFileNotFoundDoc(id: string): Observable<DocumentSafe> {
        if (id !== FILE_NOT_FOUND_ID) {
            this.logger.error(new Error(`Document file not found at '${id}'`));
            // using `getDocument` means that we can fetch the 404 doc contents from the server and cache it
            return this.getDocument(FILE_NOT_FOUND_ID);
        } else {
            return of({
                id: FILE_NOT_FOUND_ID,
                contents: htmlEscape('Document not found')
            });
        }
    }

    private getErrorDoc(id: string, error: HttpErrorResponse): Observable<DocumentSafe> {
        this.logger.error(new Error(`Error fetching document '${id}': (${error.message})`));
        this.cache.delete(id);
        return of({
            id: FETCHING_ERROR_ID,
            contents: FETCHING_ERROR_CONTENTS(id),
        });
    }

}

/**
 * 把路径编码为确定的、可逆的、不区分大小写的内容，避免在不区分大小写的文件系统上发生冲突。
 * + 把下划线（`_`）转换为双下划线（`__`）。
 * + 把大写字母转换为小写字母，并在后面添加下划线（`_`）。
 */
function encodeToLowercase(str: string): string {
    return str.replace(/[A-Z_]/g, char => char.toLowerCase() + '_');
}
