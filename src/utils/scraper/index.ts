import Request from './request';
import regex from './regex';

export interface ScraperOptions {
    proxy?: string
}

export interface Link {
    store: string,
    storeURL: string,
    pageURL: string,
    count: number
}

export default class Scraper {
    public onError?: (error: Error) => any = (error) => { console.log(error) };
    public request;

    constructor({ proxy }: ScraperOptions = {}) {
        this.request = new Request({
            requestAPIURL: 'https://uwx0k675d0.execute-api.us-east-1.amazonaws.com/Prod/request',
            proxy: proxy
        });
    }

    async scrapeSite(hostname: string, storeDomains: { [key: string]: string[] }) {
        hostname = regex.getHostname(hostname);
        const pages = new Set([`https://${hostname}/`]);
        const storeLinks: Link[] = [];
        return new Promise((resolve) => {
            const functionManager = new FunctionManager(this.scrapePage)
                .then(() => { resolve(storeLinks) })
                .catch((error) => { if (this.onError) this.onError(error) });
            functionManager.execute(`https://${hostname}/`, hostname, storeDomains, storeLinks, pages, this.request);
        });
    }

    async scrapePage(
        url: string,
        hostname: string,
        storeDomains: { [key: string]: string[] },
        storeLinks: Link[],
        pages: Set<string>, request: Request,
        functionManager: FunctionManager,
    ) {
        const dom = await this.dom(url);
        const links: {[key: string]: Link} = {};
        for (const anchorElement of Array.from(dom.window.document.links)) {
            if (anchorElement.hostname === hostname) {
                const url = `${anchorElement.origin}${anchorElement.pathname}`;
                if (!pages.has(url)) {
                    pages.add(url);
                    functionManager.execute(url, hostname, storeDomains, storeLinks, pages, request);
                }
            } else {
                for (const store in storeDomains) {
                    const domains = storeDomains[store];
                    for (const domain of domains) {
                        if (anchorElement.hostname === domain) {
                            const storeURL = `${anchorElement.origin}${anchorElement.pathname}`;
                            const link = links[storeURL];
                            if (link) link.count++;
                            else links[storeURL] = {
                                store: store,
                                storeURL: storeURL,
                                pageURL: url,
                                count: 1
                            };
                        }
                    }
                }
            }
        }
        for (const link of Object.values(links)) storeLinks.push(link);
    }

    async dom(url: string) {
        try {
            return await this.request.dom({ url: url });
        } catch (error) {
            error.message = error.message + ' ' + url;
            throw error;
        }
    }
}

class FunctionManager {
    private handler: (...args: any[]) => any;
    private onComplete?: () => any;
    private onError?: (error: Error) => void;
    private count: number = 0;

    constructor(handler: (...args: any[]) => any) {
        this.handler = handler;
        return this;
    }

    then(onComplete: (...args: any[]) => any) {
        this.onComplete = onComplete;
        return this;
    }

    catch(onError?: (error: Error) => void) {
        this.onError = onError;
        return this;
    }

    async execute(...args: any[]) {
        this.count++;
        args.push(this);
        try {
            await this.handler(...args);
        } catch (error) { if (this.onError) this.onError(error) }
        this.count--;
        if (this.onComplete && this.count === 0) this.onComplete();
    }
}