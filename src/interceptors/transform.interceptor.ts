import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from 'src/dto/response.dto';


@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseDto<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseDto<T>> {
        const ctx = context.switchToHttp();
        const response: Response = ctx.getResponse(); // response của Express
        const request: Request = ctx.getRequest();
        return next.handle().pipe(map(data => (new ResponseDto(
            response.statusCode,
            "success",
            request,
            data as T
        ))));
    }
}
