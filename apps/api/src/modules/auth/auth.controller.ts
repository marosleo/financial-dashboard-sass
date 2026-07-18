import { Body, Controller, Get, Post } from "@nestjs/common";
import type { DemoLoginRequest } from "@financial-dashboard/shared";
import { API_ROUTES } from "../../common/constants/api-routes";
import { AuthService } from "./auth.service";

@Controller(API_ROUTES.auth)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("status")
  getStatus() {
    return this.authService.getStatus();
  }

  @Get("me")
  getMe() {
    return this.authService.getMe();
  }

  @Post("login")
  login(@Body() body: DemoLoginRequest) {
    return this.authService.login(body.email);
  }

  @Post("logout")
  logout() {
    return this.authService.logout();
  }
}
