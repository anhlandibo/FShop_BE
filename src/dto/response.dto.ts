import { Request } from "express";

export class ResponseDto<T = any> {
    statusCode: number
    message: string;
    data?: T;
    timestamp: string;
    path: string
    constructor(stateCode: number, message: string, request: Request, data?: T) {
        this.statusCode = stateCode
        this.message = message
        this.data = data
        this.timestamp = new Date().toISOString()
        this.path = request?.url || ''
    }
}