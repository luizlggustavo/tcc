import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  verificarSaude(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
