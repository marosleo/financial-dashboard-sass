import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { API_PREFIX } from "./common/constants/api-routes";
import { AppModule } from "./app.module";
import { AppConfigService } from "./config/app-config.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix(API_PREFIX);

  const appConfig = app.get(AppConfigService);
  await app.listen(appConfig.port);
}

void bootstrap();
