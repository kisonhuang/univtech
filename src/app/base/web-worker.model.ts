// WebWorker消息
export interface WebWorkerMessage {
    // 消息类型
    type: string;
    // 消息id
    id?: number;
    // 有效负载
    payload: any;
}
