import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

// IMPORTS APENAS DE TIPO (para parâmetros decorados)
import type { Response } from 'express';
import type { AuthenticatedUser } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Inicia login com Google (redireciona para o provider)
   * Rota: GET /api/auth/google
   *
   * Segurança: evita abuso de redirects.
   */
  @Throttle({ default: { limit: 20, ttl: 60 } })
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    // Deixa o Passport redirecionar
  }

  /**
   * Callback do Google
   * Rota: GET /api/auth/google/callback
   *
   * Segurança: evita spam de callback.
   */
  @Throttle({ default: { limit: 30, ttl: 60 } })
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ): void {
    const token = this.authService.generateAccessToken(user);
    this.authService.setAuthCookie(res, token);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(frontendUrl);
  }

  /**
   * Logout: limpa cookie
   * Rota: POST /api/auth/logout
   *
   * Segurança: evita spam de logout.
   */
  @Throttle({ default: { limit: 30, ttl: 60 } })
  @Post('logout')
  logout(@Res() res: Response): void {
    this.authService.clearAuthCookie(res);
    res.status(204).send();
  }

  /**
   * Retorna dados básicos do usuário logado
   * Rota: GET /api/auth/me
   *
   * Pode ser chamado com frequência pelo frontend.
   */
  @Throttle({ default: { limit: 120, ttl: 60 } })
  @Get('/me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
