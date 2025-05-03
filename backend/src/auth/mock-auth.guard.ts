import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Mock user info
    request.user = { id: 1, name: 'Farhana Faruk', email: 'farhana@example.com' }; 
    return true; // Allow request to go through
  }
}
