// WebWorker消息
export interface WebWorkerMessage {
    id?: number;
    type: string;
    payload: any;
}
