import forge from '../lib';

async function test() {
    const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAix682LW8jwpZEGjFfoom
GvLHCDh8ttPgSB5CBvXZLglimVfVkA7FiGdJqlKkf2kKXqrwSICbgcYUjFHMFdy9
fvUwrKXzFXP46AzzV3ivkam2LB97eDSMI8gaIjumDaIFZAD3E9osYz4LMSI2A0nC
qs+5xZ66JeC/Dtr5W9nobushAhFzZQWS/4I7iSUkV4WFmSG1ACB267z8YZ7YFmlT
1hMFvp+biIsZIx7mebQNqjFjFPP0ZTskXg4UfQt6yyuaPqL55pQ7Wc8iI3umlsSV
hDL1q3+ry7L8VDg7EtDBbodyYT5R62zBuhe7sJrvhtt/R6fZIfISPvRbumwusbf5
XQIDAQAB
-----END PUBLIC KEY-----
`;

    const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCLHrzYtbyPClkQ
aMV+iiYa8scIOHy20+BIHkIG9dkuCWKZV9WQDsWIZ0mqUqR/aQpeqvBIgJuBxhSM
UcwV3L1+9TCspfMVc/joDPNXeK+RqbYsH3t4NIwjyBoiO6YNogVkAPcT2ixjPgsx
IjYDScKqz7nFnrol4L8O2vlb2ehu6yECEXNlBZL/gjuJJSRXhYWZIbUAIHbrvPxh
ntgWaVPWEwW+n5uIixkjHuZ5tA2qMWMU8/RlOyReDhR9C3rLK5o+ovnmlDtZzyIj
e6aWxJWEMvWrf6vLsvxUODsS0MFuh3JhPlHrbMG6F7uwmu+G239Hp9kh8hI+9Fu6
bC6xt/ldAgMBAAECggEABMjYQf68FFJM3lowF/Tshbw9mUbcuSqfxHMv86PUZeIs
6desu1vasiEqlijp9IzPrmekGbuR6Dxq+/7F1/xOaGr1KIGQ6DcObif13YIDzcIV
BxRHxN+lGzJC/dQ91tWwkvAlOeGkvv6vrVn/GrgDHH3w5mmZ/s/+2iYF8ev/CQN6
/2t68F7OGx93IwQZnet1L/fDEJbvpKNlc9FOHz9fDeh769RzMxD/QJsiV6zcJuFX
p0EFrQflFQ51sP9jKLpXgK6kKH3ugveQL0fhKHDmNFKUpz9BX2WRZh+3ix1XNk5M
Ppyhg/oeKXvphtubUEZfZRXYBLmACMqVw9ta94n5YQKBgQC/jhESKALWLl7Oc08m
GyQA03z3j3/JNaqXALSRcND38j/mpR+abI9ANDV7njwO8jtrqfXIBTGna9sqOoey
XAnLsvFkB1ndGcz7rcKi6A1CAFcEN7J6E0iePhC1HKqoY7qPMi1HLsyIKctEo20A
J7UNNSylVbUi084Dt6jTo2LPIQKBgQC57KUbHDI557km5RoisVwjyucANDs5oicr
vaSXjDhgvf0b07D5ElhSeJyzLp/LydwasUnYNM/S6az1BFSI5sAtcGiecQ36FXus
UnyWWB1B3bTa/hYPqFAT+QIIRqIqdcg8ARcaoDJgjESDYdG8Yz8N48+Dp98R22Qk
1KU4XolOvQKBgQCP7tPs7JuVDCq4vfQPEf2vkTopWm4OZoDUDfegAUFDzYcua4yf
oErTV2eIh5FhOapkb8T6ksyInIaF6Izl/DpwEPlIzC098ZEQ27OQbQTpPxAjXyaA
i9TY8pHjRLMG7EjWKEHVZtjQx3axEItqvmtQjVAKu6frj3MRYAM/Y1lvgQKBgFk9
1m4x1YXnzP53X1khqqlffguiBn9+brDXIUbAvlrpNrGBpeOXw58qV4TGL1tg8+44
BMrrZonFMgiVYIIpyDrHRuAuQdg1MZygJz7+4mQ4J9Qpu6seTfmYPzp7tOEOkeMD
XvSfyi5/hW9Op552QNDI9VUrYa4vkV0AWKG69ss9AoGAZYuK/nbQv81+AExY2vr7
KaO+FLoszYHNiFbwvjt0e10a2X4wdVrUqiiT4gujrpQEWJigrNjbAmstmjDE1zgW
VxnzlrCOTTZT7/jD4wf53nCQiqRCg2NsIq6/JYOi+tjr6dC8HA8pd58xYAkB+hbZ
wIy0/kd6szCcWK5Ld1kH9R0=
-----END PRIVATE KEY-----
`;

    const publicKey = forge.pki.publicKeyFromPem(PUBLIC_KEY);

    function byteStringToBuffer(str: string): Uint8Array {
        const { length } = str;
        const u8a = new Uint8Array(length);

        for (let i = 0; i < length; i++) {
            u8a[i] = str.charCodeAt(i);
        }

        return u8a;
    }

    function importDecryptKey(pem: string, sha: string): Promise<CryptoKey> {
        pem = pem.replace(/(-----(BEGIN|END) PRIVATE KEY-----|\s)/g, '');

        const publicKey = byteStringToBuffer(atob(pem));

        return crypto.subtle.importKey(
            'pkcs8',
            publicKey,
            {
                name: 'RSA-OAEP',
                hash: sha,
            },
            false,
            [
                'decrypt',
            ]
        );
    }

    async function decrypt(encryptedData: BufferSource, hash: string) {
        const privateKey = await importDecryptKey(PRIVATE_KEY, hash);
        const decryptedData = new TextDecoder().decode(await crypto.subtle.decrypt(
            {
                name: 'RSA-OAEP',
            },
            privateKey,
            encryptedData
        ));

        return decryptedData;
    }

    const data = 'Hello World!';
    // console.log(data);
    let encryptedData = publicKey.encrypt(data, 'RSA-OAEP', {
        md: forge.md.sha1.create(),
    });
    // console.log(encryptedData);
    let decryptedData = await decrypt(encryptedData, 'SHA-1');
    // console.log(decryptedData);
    console.log(data === decryptedData);

    encryptedData = publicKey.encrypt(data, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
    });
    decryptedData = await decrypt(encryptedData, 'SHA-256');
    console.log(data === decryptedData);

    encryptedData = publicKey.encrypt(data, 'RSA-OAEP', {
        md: forge.md.sha384.create(),
    });
    decryptedData = await decrypt(encryptedData, 'SHA-384');
    console.log(data === decryptedData);

    encryptedData = publicKey.encrypt(data, 'RSA-OAEP', {
        md: forge.md.sha512.create(),
    });
    decryptedData = await decrypt(encryptedData, 'SHA-512');
    console.log(data === decryptedData);

    encryptedData = new Uint8Array([56, 93, 67, 144, 199, 15, 51, 59, 195, 151, 19, 88, 76, 197, 92, 182, 3, 145, 173, 168, 158, 221, 96, 144, 138, 111, 31, 7, 99, 8, 79, 122, 163, 228, 184, 136, 235, 150, 136, 47, 158, 25, 64, 32, 174, 24, 237, 203, 129, 181, 171, 184, 141, 249, 250, 179, 74, 74, 210, 8, 159, 27, 134, 5, 137, 34, 200, 196, 82, 237, 211, 91, 14, 77, 77, 237, 123, 143, 141, 7, 10, 61, 8, 240, 179, 162, 44, 66, 178, 151, 59, 199, 222, 242, 71, 132, 227, 240, 108, 37, 55, 39, 11, 252, 26, 134, 97, 239, 103, 89, 253, 79, 149, 9, 198, 70, 20, 179, 89, 230, 50, 6, 147, 106, 231, 118, 225, 116, 203, 203, 185, 86, 22, 31, 233, 72, 123, 196, 54, 134, 200, 65, 98, 101, 57, 232, 105, 237, 4, 147, 135, 195, 124, 241, 62, 52, 195, 23, 47, 180, 145, 79, 196, 156, 160, 62, 28, 78, 38, 57, 18, 174, 19, 152, 235, 90, 164, 154, 247, 225, 25, 236, 203, 87, 223, 121, 20, 70, 80, 47, 181, 158, 109, 19, 172, 236, 58, 0, 25, 175, 82, 195, 161, 146, 252, 133, 209, 242, 55, 111, 155, 172, 57, 204, 234, 145, 13, 221, 225, 38, 203, 151, 4, 38, 190, 238, 10, 132, 165, 117, 28, 204, 129, 110, 123, 121, 188, 126, 91, 53, 84, 180, 176, 156, 159, 232, 108, 196, 79, 208, 194, 228, 34, 115, 234, 109]);
    decryptedData = await decrypt(encryptedData, 'SHA-1');
    console.log(data === decryptedData);
}

(async () => {
    for (let index = 0; index < 10; index++) {
        await test();
    }
})();