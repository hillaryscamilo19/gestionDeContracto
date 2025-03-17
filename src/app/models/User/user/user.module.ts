export class User {
    _id!: number;
    name!: string;
    email!: string;
    password!: string;
    token!: string;
    role!:  'Empleado' | 'admin';

}
