import http from 'http';
import https from 'https';

const formats = ['audio/', 'video/'];

export const getInfoAttachment = async (query: string) => {
    const data = await Attachment(query).catch(() => {});
    if (!data || !formats.some((x) => data.format.startsWith(x))) return null;

    return {
        playlist: null as any,
        info: [{
            title: (
                data.url
                    .split('/')
                    .filter((x) => x.length)
                    .pop() ?? 'Attachment'
            )
                .split('?')[0]
                .trim(),
            duration: 0,
            thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/ITunes_12.2_logo.png',
            engine: data.url,
            views: 0,
            author: (data.stream as any).client.servername as string,
            description: (data.stream as any).client.servername as string,
            url: data.url
        }]
    };
};

export function Attachment(url: string) {
    const _get = url.startsWith('http://') ? http : https;

    return new Promise<AttachmentRaw>((resolve, reject) => {
        _get.get(url, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`Status code: ${res.statusCode}`));
            }

            const obj = {
                stream: res,
                url: url,
                format: res.headers['content-type']
            };

            resolve(obj);
        }).on('error', (err) => {
            reject(new Error(`Network error: ${err.message}`));
        });
    });
}

export interface AttachmentRaw {
    stream: http.IncomingMessage;
    url: string;
    format: string;
}