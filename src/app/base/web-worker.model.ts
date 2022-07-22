// WebWorker消息
export interface WebWorkerMessage {
    type: string; // 消息类型
    id?: number;  // 消息id
    payload: any; // 有效负载
}
