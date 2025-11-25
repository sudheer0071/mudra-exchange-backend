import crypto from 'crypto';


// import lib
import config from '../config/index';

export const encrypt = (encryptValue) => {
    encryptValue = encryptValue.toString();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-ctr', config.secretOrKey, iv);
    const encrypted = Buffer.concat([cipher.update(encryptValue), cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export const decrypt = (decryptValue) => {
    const textParts = decryptValue.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-ctr', config.secretOrKey, iv);
    const decrpyted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrpyted.toString();
}

export const jsonEncrypt = (encryptValue) => {
    encryptValue = JSON.stringify(encryptValue);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-ctr', config.secretOrKey, iv);
    const encrypted = Buffer.concat([cipher.update(encryptValue), cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export const jsonDecrypt = (decryptValue) => {
    const textParts = decryptValue.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-ctr', config.secretOrKey, iv);
    const decrpyted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return JSON.parse(decrpyted.toString());
}


export const createHmac = (algo, secretKey) => {
    return crypto.createHmac(algo, secretKey)
}
export const randomByte = async (byte) => {
    try {
        let v=await crypto.randomBytes(byte).toString('hex');
        return v
    } catch (err) {
        return ''
    }
}

export const createHash = (algo) => {
    return crypto.createHash(algo)
}