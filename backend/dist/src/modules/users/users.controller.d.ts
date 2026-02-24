import { UsersService } from './users.service';
export declare class UsersController {
    private users;
    constructor(users: UsersService);
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        role: {
            name: string;
        };
        roleId: string;
        email: string;
        phone: string | null;
        isActive: boolean;
    }[]>;
    getRoles(): Promise<({
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
    })[]>;
    getPermissions(): Promise<{
        id: string;
        code: string;
        name: string;
        module: string | null;
        createdAt: Date;
    }[]>;
    findOne(id: string): Promise<({
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
}
