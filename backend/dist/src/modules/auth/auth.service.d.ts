import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    validateUser(email: string, password: string): Promise<({
        role: {
            rolePermissions: ({
                permission: {
                    id: string;
                    code: string;
                    name: string;
                    module: string | null;
                    createdAt: Date;
                };
            } & {
                roleId: string;
                permissionId: string;
            })[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            description: string | null;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        roleId: string;
        email: string;
        passwordHash: string;
        phone: string | null;
        isActive: boolean;
        mesobUserId: string | null;
    }) | null>;
    login(email: string, password: string): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            permissions: string[];
        };
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
        permissions: string[];
    } | null>;
}
