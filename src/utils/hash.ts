import * as bcrypt from 'bcrypt';
const hashPassword = async (raw: string) => {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(raw, salt);
}
const comparePassword = (raw: string, hashPassword: string) => {
    return bcrypt.compare(raw, hashPassword);
}
export { hashPassword, comparePassword }