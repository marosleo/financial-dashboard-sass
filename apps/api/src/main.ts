import "reflect-metadata";
import { Logger, UnauthorizedException, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { API_PREFIX } from "./common/constants/api-routes";
import { AppModule } from "./app.module";
import { AppConfigService } from "./config/app-config.service";
import { AuthContextService } from "./common/auth/auth-context.service";
import {
  DEMO_IDENTITY,
  isReadOnlyDemoRequest,
} from "./common/auth/demo-access";
import { resolveRequestId } from "./common/observability/request-id";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(AppConfigService);
  const authContext = app.get(AuthContextService);
  const httpLogger = new Logger("HTTP");
  app.enableCors({ origin: appConfig.frontendUrl });
  app.setGlobalPrefix(API_PREFIX);
  app.enableShutdownHooks();
  app.use(
    (
      request: {
        method?: string;
        path: string;
        originalUrl?: string;
        headers: Record<string, string | string[] | undefined>;
      },
      response: {
        statusCode: number;
        setHeader(name: string, value: string): void;
        once(event: string, listener: () => void): void;
      },
      next: () => void,
    ) => {
      const startedAt = Date.now();
      const requestId = resolveRequestId(request.headers["x-request-id"]);
      response.setHeader("X-Request-Id", requestId);
      response.once("finish", () => {
        httpLogger.log(
          JSON.stringify({
            event: "http_request",
            requestId,
            method: request.method,
            path: request.originalUrl ?? request.path,
            statusCode: response.statusCode,
            durationMs: Date.now() - startedAt,
          }),
        );
      });
      next();
    },
  );
  app.use(
    async (
      request: {
        method?: string;
        path: string;
        headers: Record<string, string | string[] | undefined> & {
          authorization?: string;
        };
      },
      _response: unknown,
      next: (error?: Error) => void,
    ) => {
      if (
        (request.method === "GET" &&
          (request.path === "/api/health" ||
            request.path === "/api/health/ready")) ||
        request.path === "/api/pluggy/webhooks"
      )
        return next();
      if (appConfig.demoModeEnabled && isReadOnlyDemoRequest(request)) {
        return authContext.run(DEMO_IDENTITY, next);
      }
      const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
      if (!token || !appConfig.supabaseUrl || !appConfig.supabasePublishableKey)
        return next(new UnauthorizedException());
      try {
        const response = await fetch(`${appConfig.supabaseUrl}/auth/v1/user`, {
          headers: {
            apikey: appConfig.supabasePublishableKey,
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) return next(new UnauthorizedException());
        const user = (await response.json()) as {
          id?: string;
          email?: string;
          user_metadata?: { name?: string; full_name?: string };
        };
        if (!user.id || !user.email) return next(new UnauthorizedException());
        authContext.run(
          {
            id: user.id,
            email: user.email,
            name:
              user.user_metadata?.name ??
              user.user_metadata?.full_name ??
              user.email.split("@")[0],
          },
          next,
        );
      } catch {
        return next(new UnauthorizedException());
      }
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  await app.listen(appConfig.port);
}

void bootstrap();
