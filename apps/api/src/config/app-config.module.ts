import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { appConfig } from "./app-config";
import { AppConfigService } from "./app-config.service";
import { validateEnv } from "./env.validation";

const rootEnvPath = resolve(process.cwd(), "../../.env");
loadEnv({ path: rootEnvPath });

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [rootEnvPath, ".env"],
      load: [appConfig],
      validate: validateEnv,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
