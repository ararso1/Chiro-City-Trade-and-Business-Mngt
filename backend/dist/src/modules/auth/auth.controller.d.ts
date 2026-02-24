import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            permissions: string[];
        };
    }>;
    profile(userId: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
        permissions: string[];
    } | null>;
}
