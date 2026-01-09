/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, OnModuleInit, Logger, forwardRef, Inject } from '@nestjs/common';
import { LivestreamsService } from './livestreams.service';
const NodeMediaServer = require('node-media-server');

@Injectable()
export class MediaServerService implements OnModuleInit {
  private nms: any;
  private readonly logger = new Logger('MediaServer');

  constructor(
    @Inject(forwardRef(() => LivestreamsService))
    private readonly livestreamService: LivestreamsService,
  ) {}

  onModuleInit() {
    const config = {
      rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60,
      },
      http: {
        port: 8000,
        mediaroot: './media',
        allow_origin: '*',
      },
      logType: 3,
    };
    this.nms = new NodeMediaServer(config);

    this.nms.on('prePublish', async (id, StreamPath, args) => {
      this.logger.debug(
        `[NMS Event] prePublish. ID: ${id}, Path: ${StreamPath}`,
      );

      const session = id;

      // 🔍 DEBUG: Log toàn bộ keys của session object
      this.logger.debug(`[DEBUG] Session keys:`, Object.keys(session));
      this.logger.debug(
        `[DEBUG] Session details:`,
        JSON.stringify(
          {
            id: session?.id,
            ip: session?.ip,
            publishStreamPath: session?.publishStreamPath,
            streamPath: session?.streamPath,
            appname: session?.appname,
            streamName: session?.streamName,
          },
          null,
          2,
        ),
      );

      // Try nhiều properties khác nhau
      const publishStreamPath =
        session?.publishStreamPath ||
        session?.streamPath ||
        StreamPath ||
        (session?.appname && session?.streamName
          ? `/${session.appname}/${session.streamName}`
          : undefined);

      this.logger.debug(`[DEBUG] Resolved StreamPath: "${publishStreamPath}"`);

      if (!publishStreamPath) {
        this.logger.warn(
          `[NMS Error] StreamPath is undefined/empty. Ignoring.`,
        );
        return;
      }

      try {
        const parts = publishStreamPath.split('/');
        const streamKey = parts.length > 2 ? parts[2] : undefined;

        if (!streamKey) {
          this.logger.warn(
            `[Reject] No stream key found in path: ${publishStreamPath}`,
          );
          session.reject();
          return;
        }

        this.logger.log(`🔑 [Stream Key Extracted]: "${streamKey}"`);

        const isValid = await this.livestreamService.verifyStreamKey(streamKey);

        if (!isValid) {
          this.logger.error(`❌ [Reject] Invalid Stream Key: ${streamKey}`);
          session.reject();
          return;
        }

        this.logger.log(`✅ [Accepted] Stream Key valid: ${streamKey}`);

        await this.livestreamService.updateStreamStatus(streamKey, true);
        this.logger.log(
          `🔴 [LIVE NOW] Livestream started with key: ${streamKey}`,
        );
      } catch (error) {
        this.logger.error(`[NMS Exception] Error: ${error.message}`);
      }
    });

    this.nms.on('donePublish', async (id, StreamPath, args) => {
      const session = id; // id IS the session object
      const publishStreamPath = session?.publishStreamPath || StreamPath;

      if (!publishStreamPath) return;

      const parts = publishStreamPath.split('/');
      const streamKey = parts.length > 2 ? parts[2] : undefined;

      if (streamKey) {
        this.logger.log(`⏹️ [Stream Ended] Key: ${streamKey}`);
        await this.livestreamService.updateStreamStatus(streamKey, false);
      }
    });

    this.nms.run();
    this.logger.log('🚀 Media Server started! RTMP port: 1935, HTTP-FLV port: 8000');
  }
}