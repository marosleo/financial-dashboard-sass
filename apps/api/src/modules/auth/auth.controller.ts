import { Controller, Get } from "@nestjs/common";
import { API_ROUTES } from "../../common/constants/api-routes";
import { AuthService } from "./auth.service";

@Controller(API_ROUTES.auth)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("status")
  getStatus() {
    return this.authService.getStatus();
  }
}

