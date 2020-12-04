import { JSDOM, ResourceLoader, VirtualConsole, CookieJar, ConstructorOptions } from 'jsdom';

export interface RequestOptions {
    userAgent?: string;
    hostname?: string;
    proxy?: string;
}

export interface DomRequestOptions {
    location?: string;
    url?: string;
    content?: string;
    runScripts?: 'outside-only' | 'dangerously';
}

export interface Response {
    url: string;
    type: string;
    body: any;
}

export default class Request {
    public options: RequestOptions
    private cookieJar: CookieJar;

    constructor(options?: RequestOptions) {
        this.options = {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:83.0) Gecko/20100101 Firefox/83.0',
        }
        Object.assign(this.options, options);

        this.cookieJar = new CookieJar();
    }

    async dom(options: DomRequestOptions) {
        const domOptions: ConstructorOptions = {
            resources: new ResourceLoader({
                proxy: this.options.proxy,
                strictSSL: false,
                userAgent: this.options.userAgent
            }),
            pretendToBeVisual: true,
            cookieJar: this.cookieJar
        };
        domOptions.virtualConsole = new VirtualConsole();
        domOptions.virtualConsole.sendTo(console, { omitJSDOMErrors: false });
        if (options.location) {
            if (options.location.startsWith('/'))
                options.location = `https://${this.options.hostname}${options.location}`;
            domOptions.url = options.location;
            domOptions.referrer = options.location;
        }
        if (options.runScripts) {
            domOptions.runScripts = options.runScripts;
            domOptions.beforeParse = (window) => {
                window.matchMedia = this.matchMediaStub;
            }
        }
        if (options.url) {
            if (options.url.startsWith('/'))
                options.url = `https://${this.options.hostname}${options.url}`;
            return await JSDOM.fromURL(options.url, domOptions);
        }
        return new JSDOM(options.content, domOptions);
    }

    matchMediaStub(): MediaQueryList {
        return {
            media: '',
            matches: false,
            addListener: function () { },
            removeListener: function () { },
            onchange: function () { },
            addEventListener: function () { },
            removeEventListener: function () { },
            dispatchEvent: () => false
        }
    }
}