import Request from './request';
import regex from './regex';

export interface Link {
    page: string,
    store: string,
    url: string
}

export default class Scraper {
    async scrapeSite(hostname: string, storeDomains: { [key: string]: string[] }) {
        const request = new Request();
        hostname = regex.getHostname(hostname);
        const siteLinks = [`https://${hostname}/`];
        const pages = new Set(siteLinks);
        const storeLinks = [];
        while (siteLinks.length > 0) {
            const siteLink = siteLinks.pop() as string;
            const dom = await request.dom({ url: siteLink });
            for (const anchorElement of dom.window.document.links as any) {
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
    }
}