import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type AppConfig = {
  app: {
    port: number;
    nodeEnv: string;
    frontendUrl: string;
    databaseUrl: string;
    anthropicApiKey: string;
    pluggyClientId: string;
    pluggyClientSecret: string;
  };
};

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  get port() {
    return this.configService.get("app.port", { infer: true });
  }

  get nodeEnv() {
    return this.configService.get("app.nodeEnv", { infer: true });
  }

  get frontendUrl() {
    return this.configService.get("app.frontendUrl", { infer: true });
  }

  get databaseUrl() {
    return this.configService.get("app.databaseUrl", { infer: true });
  }

  get anthropicApiKey() {
    return this.configService.get("app.anthropicApiKey", { infer: true });
  }

  get pluggyClientId() {
    return this.configService.get("app.pluggyClientId", { infer: true });
  }

  get pluggyClientSecret() {
    return this.configService.get("app.pluggyClientSecret", { infer: true });
  }
}
