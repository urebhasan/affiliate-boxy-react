import Request from './request';
import regex from './regex';

export interface ScraperOptions {
    delay?: number,
    proxy?: string
}

export interface Link {
    page: string,
    store: string,
    url: string
}

export default class Scraper {
    async scrapeSite(hostname: string, storeDomains: { [key: string]: string[] }, { delay, proxy }: ScraperOptions = {}) {
        const request = new Request({
            requestAPIURL: 'https://uwx0k675d0.execute-api.us-east-1.amazonaws.com/Prod/request',
            proxy: proxy
        });
        hostname = regex.getHostname(hostname);
        const storeLinks = [];
        const siteLinks = [`https://${hostname}/`];
        const pages = new Set(siteLinks);
        while (siteLinks.length > 0) {
            const siteLink = siteLinks.pop();
            if (delay) await new Promise(resolve => setTimeout(resolve, delay))
            const dom = await request.dom({ url: siteLink });
            for (const anchorElement of Array.from(dom.window.document.links)) {
                if (anchorElement.hostname === hostname) {
                    const url = `${anchorElement.origin}${anchorElement.pathname}`;
                    if (!pages.has(url)) {
                        pages.add(url);
                        siteLinks.push(url);
                    }
                } else {
                    for (const store in storeDomains) {
                        const domains = storeDomains[store];
                        for (const domain of domains) {
                            if (anchorElement.hostname === domain) {
                                storeLinks.push({
                                    store: store,
                                    url: `${anchorElement.origin}${anchorElement.pathname}`,
                                    page: siteLink
                                });
                            }
                        }
                    }
                }
            }
        }
        return storeLinks;
    }
}