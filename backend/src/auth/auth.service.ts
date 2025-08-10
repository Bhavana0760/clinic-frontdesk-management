import { Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import * as bcrypt from "bcrypt"
import { Repository } from "typeorm"
import { InjectRepository } from "@nestjs/typeorm"
import { User } from "../entities/user.entity"

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.usersRepo.findOne({ where: { username } })
    if (!user) throw new UnauthorizedException("Invalid credentials")
    
    console.log('Debug - password:', password)
    console.log('Debug - user.passwordHash:', user.passwordHash)
    console.log('Debug - password type:', typeof password)
    console.log('Debug - passwordHash type:', typeof user.passwordHash)
    
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) throw new UnauthorizedException("Invalid credentials")
    return user
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password)
    const payload = { sub: user.id, username: user.username, role: user.role }
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: "2h" })
    return { accessToken, user: { id: user.id, username: user.username, role: user.role } }
  }
}
