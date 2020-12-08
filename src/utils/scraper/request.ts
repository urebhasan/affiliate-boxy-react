import { JSDOM, ResourceLoader, VirtualConsole, ConstructorOptions } from 'jsdom';
import { CookieJar, Cookie } from 'tough-cookie';

export interface RequestOptions {
    headers?: { [key: string]: string };
    userAgent?: string;
    hostname?: string;
    proxy?: string;
    requestAPIURL?: string;
}

export interface DomOptions {
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
    public headers;
    public userAgent;
    public hostname;
    public proxy;
    private requestAPIURL;
    private cookieJar: CookieJar;

    constructor({
        headers = {},
        userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:83.0) Gecko/20100101 Firefox/83.0',
        hostname,
        proxy,
        requestAPIURL,
    }: RequestOptions = {}) {
        this.headers = headers;
        this.userAgent = userAgent;
        this.hostname = hostname;
        this.proxy = proxy;
        this.requestAPIURL = 'http://localhost:3000/request';
        //this.requestAPIURL = requestAPIURL;

        this.cookieJar = new CookieJar();
    }

    async get(url: string, query?: { [key: string]: any }, headers?: { [key: string]: string }) {
        const options: { [key: string]: any } = { 
            method: 'GET',
            headers: headers,
        };
        if (query) options.url.search = new URLSearchParams(query);
        return await this._request(url, options);
    }

    async post(url: string, body?: string, headers?: { [key: string]: string }) {
        const options: { [key: string]: any } = {
            method: 'POST',
            headers: headers,
            body: body,
        };
        return await this._request(url, options);
    }

    async _request(url: string, options: { [key: string]: any }) {
        if (url.startsWith('/')) url = `https://${this.hostname}${url}`;
        console.log(`${options.method} Request ${url}`);
        options.url = new URL(url);
        options.proxy = this.proxy;
        if (this.requestAPIURL) {
            options.cookies = await this.cookieJar.serialize();
            const APIResponse = await fetch(this.requestAPIURL, {
                method: 'POST',
                mode: 'cors',
                body: JSON.stringify(options)
            });
            const requestResponse = JSON.parse(await APIResponse.text());
            if (APIResponse.ok) {
                const cookieHeader = requestResponse.headers['set-cookie'];
                if (cookieHeader) {
                    const cookies = [Cookie.parse(cookieHeader)];
                    for (const cookie of cookies) if (cookie) await this.cookieJar.setCookie(cookie, options.url);
                }
                return requestResponse;
            } else throw new Error(requestResponse.message);
        }
    }

    async dom(options: DomOptions) {
        const domOptions: ConstructorOptions = {
            resources: new ResourceLoader({
                proxy: this.proxy,
                strictSSL: false,
                userAgent: this.userAgent
            }),
            pretendToBeVisual: true,
            cookieJar: this.cookieJar
        };
        domOptions.virtualConsole = new VirtualConsole();
        domOptions.virtualConsole.sendTo(console, { omitJSDOMErrors: true });
        if (options.location) {
            if (options.location.startsWith('/'))
                options.location = `https://${this.hostname}${options.location}`;
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
            const response = await this.get(options.url);
            options.content = response.body;
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