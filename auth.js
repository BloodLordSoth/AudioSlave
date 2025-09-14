import bcrypt from 'bcrypt'

export async function hashPass(password){
    const hash = await bcrypt.hash(password, 10)
    return hash
}

export async function checkHash(password, string){
    const hash = await bcrypt.compare(password, string)
    return hash
}