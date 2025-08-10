import { Controller, Post, Body } from "@nestjs/common"
import { AuthService } from "./auth.service"
import type { LoginDto } from "./dto/login.dto"

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() body: any) {
    console.log('Debug - Raw body:', body)
    console.log('Debug - body type:', typeof body)
    console.log('Debug - body.username:', body.username)
    console.log('Debug - body.password:', body.password)
    return this.authService.login(body.username, body.password)
  }
}
