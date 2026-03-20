import { Request, Response } from "express";
import { NotificationsService } from "../../../application/services/notifications-service.js";

export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  inbox = async (req: Request, res: Response) => {
    const data = await this.notificationsService.inbox(req.auth!.tenantId);
    res.json({ data });
  };

  stream = async (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const send = async () => {
      const data = await this.notificationsService.inbox(req.auth!.tenantId);
      res.write(`data: ${JSON.stringify({ data })}\n\n`);
    };

    await send();
    const interval = setInterval(send, 20000);
    req.on("close", () => {
      clearInterval(interval);
      res.end();
    });
  };
}
