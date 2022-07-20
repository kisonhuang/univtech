import {Injectable} from '@angular/core';

import {Observable, from} from 'rxjs';
import {share, map, first} from 'rxjs/operators';

import {htmlFromStringKnownToSatisfyTypeContract} from 'safevalues/unsafe/reviewed';

import {LogService} from '../../base/log.service';

// 代码美化对象
type PrettyPrintOne = (code: TrustedHTML, language?: string, linenum?: number | boolean) => string;

// 代码美化服务，包装prettify.js库
@Injectable()
export class CodePrettyService {

    // 代码美化对象的Observable
    private prettyPrintOne: Observable<PrettyPrintOne>;

    /**
     * 构造函数，创建代码美化服务
     *
     * @param logService 日志服务
     */
    constructor(private logService: LogService) {
        this.prettyPrintOne = from(this.getPrettyPrintOne()).pipe(share());
    }

    /**
     * 获取代码美化对象
     *
     * @return Promise<PrettyPrintOne> 代码美化对象的Promise
     */
    private getPrettyPrintOne(): Promise<PrettyPrintOne> {
        const pretty = (window as any).prettyPrintOne;
        return pretty ? Promise.resolve(pretty) : import('assets/js/prettify.js' as any).then(
            () => (window as any).prettyPrintOne,
            error => {
                const message = `无法获取prettify.js：${error.message}`;
                this.logService.error(new Error(message));
                return () => {
                    throw new Error(message);
                };
            });
    }

    /**
     * 格式化代码片段
     *
     * @param code 代码片段
     * @param language 代码语言，例如：html、javascript、typescript
     * @param linenum 是否显示行号，number：从这个数字开始显示行号，true：显示行号，false：不显示行号
     * @return Observable<string> 已格式化代码的Observable
     */
    formatCode(code: TrustedHTML, language?: string, linenum?: number | boolean) {
        return this.prettyPrintOne.pipe(
            map(pretty => {
                try {
                    return htmlFromStringKnownToSatisfyTypeContract(pretty(code, language, linenum), 'prettify.js修改时已信任内联HTML');
                } catch (error) {
                    const message = `无法格式化代码：'${code.toString().slice(0, 50)}...'`;
                    console.error(message, error);
                    throw new Error(message);
                }
            }),
            first(),
        );
    }

}
